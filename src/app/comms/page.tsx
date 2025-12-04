"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { restoreWalletSession } from "@/lib/walletSessionManager";
import MessagingSystem from "@/components/MessagingSystem";

export default function CommsPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user profile for company name
  const userProfile = useQuery(
    api.users.getUserProfile,
    walletAddress ? { walletAddress } : "skip"
  );

  // Restore wallet session on mount
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        const address = session.stakeAddress || session.walletAddress;
        setWalletAddress(address);
      } else {
        // Not connected - redirect to landing
        router.push("/landing");
      }
      setIsLoading(false);
    };
    initWallet();
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-400">Connecting...</div>
        </div>
      </div>
    );
  }

  // If no wallet, show nothing (redirect is happening)
  if (!walletAddress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📡</div>
              <div>
                <h1
                  className="text-2xl font-bold text-white tracking-wider"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  COMMUNICATIONS
                </h1>
                <p className="text-gray-400 text-sm">
                  Secure messaging between corporations
                </p>
              </div>
            </div>

            {/* User info */}
            {userProfile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white font-medium">
                    {(userProfile as any).companyName || "Unknown Corp"}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {(userProfile as any).mekCount || 0} Meks
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <MessagingSystem
          walletAddress={walletAddress}
          companyName={(userProfile as any)?.companyName}
        />
      </div>
    </div>
  );
}
