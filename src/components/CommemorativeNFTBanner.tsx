"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getPaymentAddress } from "@/lib/cardano-addresses";
import { toastError, toastSuccess, toastInfo } from "@/lib/toast";

interface CommemorativeNFTBannerProps {
  userId: Id<"users"> | null;
  walletAddress: string | null;
  walletApi?: any; // CIP-30 wallet API (e.g., window.cardano.nami)
}

/**
 * Commemorative NFT Purchase Banner
 *
 * Shows when user is eligible to purchase commemorative NFT (5 ADA).
 * Eligibility: Verified wallet + gold > 0 (mainnet) OR connected wallet (testnet).
 *
 * TESTNET MODE: Auto-qualifies any connected wallet for easy testing.
 * MAINNET MODE: Requires real blockchain verification and gold accumulation.
 */
export default function CommemorativeNFTBanner({
  userId,
  walletAddress,
  walletApi,
}: CommemorativeNFTBannerProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Check eligibility
  const eligibility = useQuery(
    api.commemorative.checkEligibility,
    userId ? { userId } : "skip"
  );

  // Check if already purchased
  const existingPurchase = useQuery(
    api.commemorative.getPurchase,
    userId ? { userId, campaignName: "Commemorative Token 1" } : "skip"
  );

  // Create purchase mutation
  const createPurchase = useMutation(api.commemorative.createPurchase);

  // Don't show banner if:
  // - No user/wallet
  // - Not eligible
  // - Already purchased
  // - Loading
  if (!userId || !walletAddress) return null;
  if (!eligibility) return null; // Loading
  if (!eligibility.eligible) return null; // Not eligible
  if (existingPurchase) return null; // Already purchased

  const handlePurchaseClick = async () => {
    if (!walletApi) {
      toastError("No wallet connected. Please connect your wallet first.");
      return;
    }

    setIsPurchasing(true);

    try {
      // Extract payment address from wallet
      const paymentAddress = await getPaymentAddress(walletApi);
      console.log("[Commemorative] Extracted payment address:", paymentAddress);

      // Create pending purchase record
      const purchaseId = await createPurchase({
        userId,
        walletAddress,
        paymentAddress,
        campaignName: "Commemorative Token 1",
        goldAtPurchase: eligibility.goldAmount,
      });

      console.log("[Commemorative] Created purchase record:", purchaseId);

      // Get environment variables
      const nmkrNetwork = process.env.NEXT_PUBLIC_NMKR_NETWORK || "testnet";
      const nmkrProjectId = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID;

      if (!nmkrProjectId || nmkrProjectId === "placeholder-get-from-nmkr-dashboard") {
        toastError("NMKR Project ID not configured. Please set NEXT_PUBLIC_NMKR_PROJECT_ID in .env.local");
        setIsPurchasing(false);
        return;
      }

      // Open NMKR widget
      // @ts-ignore - NMKR widget is loaded via script tag
      if (typeof window.NMKRPaymentWidget !== "undefined") {
        // @ts-ignore
        window.NMKRPaymentWidget.open({
          projectId: nmkrProjectId,
          network: nmkrNetwork,
          customerAddress: paymentAddress,
          metadata: {
            purchaseId: purchaseId,
            walletAddress: walletAddress,
            campaignName: "Commemorative Token 1",
          },
        });

        toastSuccess("Opening NMKR payment widget...");
      } else {
        toastError("NMKR widget not loaded. Please refresh the page.");
      }

      setIsPurchasing(false);
    } catch (error) {
      console.error("[Commemorative] Purchase error:", error);
      toastError(
        error instanceof Error
          ? error.message
          : "Failed to initiate purchase. Please try again."
      );
      setIsPurchasing(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-yellow-500/10 via-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/50 backdrop-blur-sm p-6 mb-6">
      {/* Commemorative NFT Banner Content */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-['Orbitron'] font-bold text-yellow-500 uppercase tracking-wider mb-2">
            Commemorative NFT Available
          </h3>
          <p className="text-sm text-yellow-500/80">
            {eligibility.testMode ? (
              <span className="text-yellow-400/90">
                [TESTNET MODE] You're auto-qualified to purchase the commemorative NFT!
              </span>
            ) : (
              <span>
                You're eligible to purchase the commemorative NFT for <strong>5 ADA</strong>.
                <br />
                Gold: <strong>{eligibility.goldAmount.toFixed(2)}</strong> | Meks:{" "}
                <strong>{eligibility.mekCount}</strong>
              </span>
            )}
          </p>
        </div>

        {/* Right: Purchase Button */}
        <div>
          <button
            onClick={handlePurchaseClick}
            disabled={isPurchasing}
            className="bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500 px-8 py-4 transition-all hover:bg-yellow-500/30 hover:border-yellow-400 active:bg-yellow-500/40 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider font-['Orbitron'] font-bold backdrop-blur-sm relative overflow-hidden"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative flex items-center gap-3">
              {isPurchasing ? (
                <>
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 border-r-yellow-500 rounded-full animate-spin"></div>
                  </div>
                  <span className="text-sm">Processing...</span>
                </>
              ) : (
                <span className="text-sm">Purchase NFT (5 ADA)</span>
              )}
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/50"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/50"></div>
          </button>
        </div>
      </div>

      {/* Testnet indicator */}
      {eligibility.testMode && (
        <div className="mt-4 pt-4 border-t border-yellow-500/30">
          <p className="text-xs text-yellow-500/60 text-center font-['Orbitron']">
            TESTNET MODE ACTIVE - Switch to mainnet by setting NEXT_PUBLIC_TESTNET_MODE=false
          </p>
        </div>
      )}
    </div>
  );
}
