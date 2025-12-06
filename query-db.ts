import { api } from "./convex/_generated/api";
import { ConvexClient } from "convex/browser";

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fabulous-sturgeon-691.convex.cloud");

async function queryLabRats() {
  try {
    console.log("\nQuerying Lab Rat NFT records from database...\n");
    
    // Query the debug function
    const results = await client.query(api.commemorativeNFTInventorySetup.debugLabRatRecords);
    
    console.log("========== LAB RAT #1 ==========");
    if (results[0]) {
      console.log("Name:", results[0].name);
      console.log("NFT Number:", results[0].nftNumber);
      console.log("NFT UID:", results[0].nftUid);
      console.log("Project ID:", results[0].projectId);
      console.log("Payment URL:", results[0].paymentUrl);
      console.log("Status:", results[0].status);
    }
    
    console.log("\n========== LAB RAT #2 ==========");
    if (results[1]) {
      console.log("Name:", results[1].name);
      console.log("NFT Number:", results[1].nftNumber);
      console.log("NFT UID:", results[1].nftUid);
      console.log("Project ID:", results[1].projectId);
      console.log("Payment URL:", results[1].paymentUrl);
      console.log("Status:", results[1].status);
    }
    
    console.log("\n========== LAB RAT #3 ==========");
    if (results[2]) {
      console.log("Name:", results[2].name);
      console.log("NFT Number:", results[2].nftNumber);
      console.log("NFT UID:", results[2].nftUid);
      console.log("Project ID:", results[2].projectId);
      console.log("Payment URL:", results[2].paymentUrl);
      console.log("Status:", results[2].status);
    }
    
    console.log("\n========== RAW JSON ==========");
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

queryLabRats();
