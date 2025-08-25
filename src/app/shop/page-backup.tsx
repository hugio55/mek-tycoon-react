"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function ShopPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getOrCreateUser({ 
          walletAddress: "demo_wallet_123" 
        });
        if (user) {
          setUserId(user._id as Id<"users">);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };
    initUser();
  }, []);

  return (
    <div className="text-white p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">Shop - Debug Mode</h1>
      <p>Testing basic page rendering...</p>
      <p>User ID: {userId || "Loading..."}</p>
    </div>
  );
}