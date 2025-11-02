'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';
import { buildCommemorativeMetadata } from '@/lib/cardano/metadata';
import { mintNFT } from '@/lib/cardano/mintingTx';

interface AirdropClaimBannerProps {
  userId: Id<"users"> | null;
  walletAddress: string | null;
}

type MintStatus =
  | "idle"
  | "checking"
  | "eligible"
  | "ineligible"
  | "reserving"
  | "building_tx"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export default function AirdropClaimBanner({ userId, walletAddress }: AirdropClaimBannerProps) {
  const [mintStatus, setMintStatus] = useState<MintStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reservationId, setReservationId] = useState<Id<"commemorativeTokens"> | null>(null);
  const [editionNumber, setEditionNumber] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const TOKEN_TYPE = "phase_1_beta";
  const PRICE_ADA = 10;

  // Query eligibility
  const eligibility = useQuery(
    api.commemorativeTokens.checkBetaTesterEligibility,
    walletAddress ? { walletAddress, tokenType: TOKEN_TYPE } : "skip"
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
    if (!walletAddress) {
      setMintStatus("idle");
      return;
    }

    if (eligibility === undefined) {
      setMintStatus("checking");
      return;
    }

    if (eligibility.eligible) {
      setMintStatus("eligible");
    } else {
      setMintStatus("ineligible");
      setErrorMessage(eligibility.reason);
    }
  }, [walletAddress, eligibility]);

  // Format claim date nicely
  const formatClaimDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleMint = async () => {
    if (!walletAddress || !eligibility?.eligible) return;

    try {
      // Step 1: Reserve edition number
      setMintStatus("reserving");
      const reservation = await reserveEdition({
        tokenType: TOKEN_TYPE,
        walletAddress: walletAddress,
        userId: eligibility.userId,
      });

      setReservationId(reservation.reservationId);
      setEditionNumber(reservation.editionNumber);

      // Step 2: Build metadata
      setMintStatus("building_tx");

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
      setMintStatus("signing");

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
        paymentLovelace: PRICE_ADA * 1_000_000,
        treasuryAddress,
      });

      setMintStatus("submitting");
      setTxHash(result.txHash);

      // Step 4: Confirm mint in database
      setMintStatus("confirming");
      await confirmMint({
        reservationId: reservation.reservationId,
        txHash: result.txHash,
        policyId,
        assetName,
        explorerUrl: result.explorerUrl,
      });

      setMintStatus("success");

    } catch (error) {
      console.error("[CommemorativeMint] Error:", error);
      setMintStatus("error");

      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);

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

  // Don't show banner if not connected
  if (mintStatus === "idle" || mintStatus === "checking") return null;

  // Show small green claimed text if user already claimed
  if (mintStatus === "ineligible" && eligibility?.hasClaimed && eligibility?.claimedAt) {
    return (
      <div className="mb-4 text-center">
        <p className="text-green-400 text-sm">
          ✓ You claimed your Phase 1 commemorative NFT on {formatClaimDate(eligibility.claimedAt)}
        </p>
      </div>
    );
  }

  // Don't show banner if ineligible for other reasons
  if (mintStatus === "ineligible") return null;

  // Success state
  if (mintStatus === "success") {
    return (
      <div
        className="mb-6 p-6 rounded-xl border-4"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.35) 0%, rgba(74, 222, 128, 0.4) 100%)',
          borderColor: '#22c55e',
          boxShadow: '0 0 40px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(74, 222, 128, 0.3)'
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#dcfce7',
              textShadow: '0 0 15px rgba(34, 197, 94, 0.8)',
              letterSpacing: '0.05em'
            }}
          >
            Minted Successfully!
          </h3>
          <p className="text-green-200 mb-2">
            Phase 1: I Was There - Edition #{editionNumber}
          </p>
          {txHash && (
            <a
              href={`https://${process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet' ? '' : 'preprod.'}cardanoscan.io/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all mt-4"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              View on Explorer
            </a>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (mintStatus === "error") {
    return (
      <div
        className="mb-6 p-6 rounded-xl border-4"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(220, 38, 38, 0.4) 100%)',
          borderColor: '#ef4444',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.8), inset 0 0 30px rgba(220, 38, 38, 0.3)'
        }}
      >
        <div className="text-center">
          <h3
            className="text-2xl font-bold mb-2 text-red-200"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
              letterSpacing: '0.05em'
            }}
          >
            Minting Failed
          </h3>
          <p className="text-red-200 mb-4 text-sm">{errorMessage}</p>
          <button
            onClick={() => {
              setMintStatus("eligible");
              setErrorMessage("");
              setReservationId(null);
              setEditionNumber(null);
              setTxHash("");
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Processing states
  if (["reserving", "building_tx", "signing", "submitting", "confirming"].includes(mintStatus)) {
    const statusMessages: Record<string, string> = {
      reserving: "Reserving your edition...",
      building_tx: `Building transaction for Edition #${editionNumber}...`,
      signing: "Please sign the transaction in your wallet...",
      submitting: "Submitting transaction to blockchain...",
      confirming: "Confirming mint...",
    };

    return (
      <div
        className="mb-6 p-6 rounded-xl border-4"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.4) 100%)',
          borderColor: '#06b6d4',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#e0f2fe',
              textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
              letterSpacing: '0.05em'
            }}
          >
            Processing...
          </h3>
          <p className="text-cyan-200 text-sm">{statusMessages[mintStatus]}</p>
          {editionNumber && (
            <p className="text-cyan-300 text-xs mt-2">Edition #{editionNumber}</p>
          )}
        </div>
      </div>
    );
  }

  // Eligible - show mint button
  return (
    <div
      className="mb-6 p-6 rounded-xl border-4"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.4) 100%)',
        borderColor: '#06b6d4',
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.3)'
      }}
    >
      <div className="text-center">
        <h3
          className="text-xl font-bold mb-2"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#e0f2fe',
            textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
            letterSpacing: '0.05em'
          }}
        >
          Phase 1: Commemorative NFT
        </h3>
        <p
          className="text-sm mb-2"
          style={{
            color: '#bae6fd',
            lineHeight: '1.5',
            fontSize: '0.875rem'
          }}
        >
          Awarded to early supporters who connected their wallet and accumulated gold
        </p>

        {tokenInfo?.exists && (
          <p
            className="text-sm mb-4"
            style={{
              color: '#7dd3fc',
              lineHeight: '1.6'
            }}
          >
            Next Edition: <span className="font-bold text-yellow-400">#{tokenInfo.nextEdition}</span>
          </p>
        )}

        <p
          className="text-xs mb-4 text-cyan-300/80"
          style={{
            lineHeight: '1.6'
          }}
        >
          Price: {PRICE_ADA} ₳ • Sequential Edition • jpg.store Compatible
        </p>

        <div className="w-full max-w-xs mx-auto">
          <HolographicButton
            text="Claim Your NFT"
            onClick={handleMint}
            isActive={true}
            variant="yellow"
            alwaysOn={true}
            hideIcon={true}
            className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
          />
        </div>
      </div>
    </div>
  );
}
