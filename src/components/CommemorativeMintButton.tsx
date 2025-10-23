"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useWallet } from "@/contexts/WalletContext";
import { buildCommemorativeMetadata } from "@/lib/cardano/metadata";
import { mintNFT } from "@/lib/cardano/mintingTx";

type MintStatus =
  | "idle"
  | "checking_eligibility"
  | "eligible"
  | "ineligible"
  | "reserving"
  | "building_tx"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export default function CommemorativeMintButton() {
  const { walletAddress, isConnected } = useWallet();
  const [status, setStatus] = useState<MintStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reservationId, setReservationId] = useState<Id<"commemorativeTokens"> | null>(null);
  const [editionNumber, setEditionNumber] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const TOKEN_TYPE = "phase_1_beta";
  const PRICE_ADA = 10;

  // Query eligibility
  const eligibility = useQuery(
    api.commemorativeTokens.checkBetaTesterEligibility,
    walletAddress && isConnected
      ? { walletAddress, tokenType: TOKEN_TYPE }
      : "skip"
  );

  // Query token type info (shows next edition)
  const tokenInfo = useQuery(
    api.commemorativeTokens.getTokenTypeInfo,
    { tokenType: TOKEN_TYPE }
  );

  // Mutations
  const reserveEdition = useMutation(api.commemorativeTokens.reserveEdition);
  const confirmMint = useMutation(api.commemorativeTokens.confirmMint);
  const markFailed = useMutation(api.commemorativeTokens.markMintFailed);

  // Update status based on eligibility
  useEffect(() => {
    if (!isConnected) {
      setStatus("idle");
      return;
    }

    if (eligibility === undefined) {
      setStatus("checking_eligibility");
      return;
    }

    if (eligibility.eligible) {
      setStatus("eligible");
    } else {
      setStatus("ineligible");
      setErrorMessage(eligibility.reason);
    }
  }, [isConnected, eligibility]);

  const handleMint = async () => {
    if (!walletAddress || !eligibility?.eligible) return;

    try {
      // Step 1: Reserve edition number
      setStatus("reserving");
      const reservation = await reserveEdition({
        tokenType: TOKEN_TYPE,
        walletAddress: walletAddress,
        userId: eligibility.userId,
      });

      setReservationId(reservation.reservationId);
      setEditionNumber(reservation.editionNumber);

      // Step 2: Build metadata
      setStatus("building_tx");

      const assetName = `Phase1IWasThere${reservation.editionNumber.toString().padStart(4, '0')}`;
      const policyId = process.env.NEXT_PUBLIC_COMMEMORATIVE_POLICY_ID || "";

      if (!policyId) {
        throw new Error("Commemorative policy ID not configured");
      }

      const metadata = buildCommemorativeMetadata(
        policyId,
        assetName,
        {
          editionNumber: reservation.editionNumber,
          tokenType: TOKEN_TYPE,
          displayName: reservation.displayName,
          imageUrl: reservation.imageUrl,
          walletAddress: walletAddress,
        }
      );

      // Step 3: Build and submit transaction
      setStatus("signing");

      const treasuryAddress = process.env.NEXT_PUBLIC_CARDANO_NETWORK === "mainnet"
        ? process.env.NEXT_PUBLIC_TREASURY_ADDRESS_MAINNET
        : process.env.NEXT_PUBLIC_TREASURY_ADDRESS_TESTNET;

      if (!treasuryAddress) {
        throw new Error("Treasury address not configured");
      }

      const result = await mintNFT({
        recipientAddress: walletAddress,
        assetName,
        metadata,
        paymentLovelace: PRICE_ADA * 1_000_000, // Convert ADA to lovelace
        treasuryAddress,
      });

      setStatus("submitting");
      setTxHash(result.txHash);

      // Step 4: Confirm mint in database
      setStatus("confirming");
      await confirmMint({
        reservationId: reservation.reservationId,
        txHash: result.txHash,
        policyId,
        assetName,
        explorerUrl: result.explorerUrl,
      });

      setStatus("success");

    } catch (error) {
      console.error("[CommemorativeMint] Error:", error);
      setStatus("error");

      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);

      // Mark as failed in database if we have a reservation
      if (reservationId) {
        try {
          await markFailed({
            reservationId,
            errorMessage: errorMsg,
          });
        } catch (markFailedError) {
          console.error("[CommemorativeMint] Failed to mark as failed:", markFailedError);
        }
      }
    }
  };

  // Not connected to wallet
  if (!isConnected) {
    return (
      <div className="mek-card-industrial p-6 text-center">
        <p className="mek-label-uppercase mb-4">Phase 1 Commemorative Token</p>
        <p className="text-gray-400">Connect your wallet to check eligibility</p>
      </div>
    );
  }

  // Checking eligibility
  if (status === "checking_eligibility") {
    return (
      <div className="mek-card-industrial p-6 text-center">
        <p className="mek-label-uppercase mb-4">Phase 1 Commemorative Token</p>
        <p className="text-gray-400">Checking eligibility...</p>
      </div>
    );
  }

  // Ineligible
  if (status === "ineligible") {
    return (
      <div className="mek-card-industrial p-6 text-center">
        <p className="mek-label-uppercase mb-4">Phase 1 Commemorative Token</p>
        <p className="text-gray-400 mb-2">Not Eligible</p>
        <p className="text-sm text-gray-500">{errorMessage}</p>
      </div>
    );
  }

  // Success
  if (status === "success") {
    return (
      <div className="mek-card-industrial p-6 text-center">
        <div className="mek-overlay-hazard-stripes opacity-10"></div>
        <p className="mek-label-uppercase mb-4">Phase 1 Commemorative Token</p>
        <div className="mek-glow-yellow inline-block mb-4">
          <p className="mek-value-primary text-4xl mb-2">✓</p>
          <p className="text-yellow-400 text-xl font-bold">Edition #{editionNumber}</p>
        </div>
        <p className="text-gray-400 mb-4">Successfully minted!</p>
        {txHash && (
          <a
            href={`https://${process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet' ? '' : 'preprod.'}cardanoscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mek-button-primary text-sm"
          >
            View on Explorer
          </a>
        )}
      </div>
    );
  }

  // Error
  if (status === "error") {
    return (
      <div className="mek-card-industrial p-6 text-center border-red-500/50">
        <p className="mek-label-uppercase mb-4 text-red-400">Minting Failed</p>
        <p className="text-gray-400 mb-4">{errorMessage}</p>
        <button
          onClick={() => {
            setStatus("eligible");
            setErrorMessage("");
            setReservationId(null);
            setEditionNumber(null);
            setTxHash("");
          }}
          className="mek-button-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Processing states
  if (["reserving", "building_tx", "signing", "submitting", "confirming"].includes(status)) {
    const statusMessages: Record<string, string> = {
      reserving: "Reserving your edition...",
      building_tx: `Building transaction for Edition #${editionNumber}...`,
      signing: "Please sign the transaction in your wallet...",
      submitting: "Submitting transaction to blockchain...",
      confirming: "Confirming mint...",
    };

    return (
      <div className="mek-card-industrial p-6 text-center">
        <p className="mek-label-uppercase mb-4">Phase 1 Commemorative Token</p>
        <div className="mek-glow-yellow inline-block mb-4">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
        </div>
        <p className="text-gray-400">{statusMessages[status]}</p>
        {editionNumber && (
          <p className="text-yellow-400 text-sm mt-2">Edition #{editionNumber}</p>
        )}
      </div>
    );
  }

  // Eligible - show mint button
  return (
    <div className="mek-card-industrial p-6">
      <div className="mek-overlay-hazard-stripes opacity-5"></div>
      <div className="relative">
        <p className="mek-label-uppercase mb-2">Phase 1 Commemorative Token</p>
        <h3 className="mek-text-industrial text-2xl mb-4">Phase 1: I Was There</h3>

        {tokenInfo?.exists && (
          <div className="mb-4 p-3 bg-black/40 border border-yellow-500/30 rounded">
            <p className="mek-label-uppercase mb-1">Next Edition</p>
            <p className="mek-value-primary text-3xl">#{tokenInfo.nextEdition}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-2">
            Commemorative NFT for Phase 1 beta testers. Sequential edition minting.
          </p>
          <p className="text-gray-400 text-sm">
            Includes royalties for jpg.store trading.
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <p className="mek-label-uppercase mb-2">Price</p>
          <p className="mek-value-primary text-4xl">{PRICE_ADA} ₳</p>
        </div>

        <button
          onClick={handleMint}
          className="mek-button-primary w-full text-lg py-4"
        >
          Mint Edition #{tokenInfo?.nextEdition || '...'}
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Limited to one per wallet
        </p>
      </div>
    </div>
  );
}
