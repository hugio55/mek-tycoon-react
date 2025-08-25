"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function HubPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("Starting user initialization...");
        const user = await getOrCreateUser({ 
          walletAddress: "demo_wallet_123" 
        });
        console.log("User created/fetched:", user);
        if (user) {
          setUserId(user._id as Id<"users">);
        }
      } catch (err) {
        console.error("Error initializing user:", err);
        setError(String(err));
      }
    };
    initUser();
  }, []);
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  console.log("Render - userId:", userId, "userProfile:", userProfile);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">Hub Page - Debug Mode</h1>
      {error && (
        <div className="bg-red-900 text-red-100 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}
      <div className="space-y-2">
        <p>User ID: {userId || "Not set"}</p>
        <p>User Profile: {userProfile ? "Loaded" : "Not loaded"}</p>
        {userProfile && (
          <div className="mt-4 p-4 bg-gray-900 rounded">
            <p>Gold: {userProfile.gold}</p>
            <p>Wallet: {userProfile.walletAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
}