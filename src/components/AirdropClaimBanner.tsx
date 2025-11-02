'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import HolographicButton from '@/components/ui/SciFiButtons/HolographicButton';
import NMKRPayLightbox from '@/components/NMKRPayLightbox';
import NFTClaimSuccess from '@/components/NFTClaimSuccess';

interface AirdropClaimBannerProps {
  userId: Id<"users"> | null;
  walletAddress: string | null;
}

type ClaimStatus =
  | "idle"
  | "checking"
  | "eligible"
  | "ineligible"
  | "processing"
  | "success";

export default function AirdropClaimBanner({ userId, walletAddress }: AirdropClaimBannerProps) {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [showLightbox, setShowLightbox] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [debugClaimState, setDebugClaimState] = useState<'claimed' | 'unclaimed' | null>(null);

  const PRICE_ADA = 10;

  // Query eligibility (NEW SIMPLE SYSTEM)
  const eligibility = useQuery(
    api.nftEligibility.checkClaimEligibility,
    walletAddress ? { walletAddress } : "skip"
  );

  // Load debug state from localStorage and listen for changes
  useEffect(() => {
    const loadDebugState = () => {
      const saved = localStorage.getItem('debug_claim_state');
      if (saved === 'claimed' || saved === 'unclaimed') {
        setDebugClaimState(saved);
      } else {
        setDebugClaimState(null);
      }
    };

    loadDebugState();

    // Listen for storage events from debug panel toggle
    const handleStorageChange = () => {
      loadDebugState();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update status based on eligibility
  useEffect(() => {
    if (!walletAddress) {
      setClaimStatus("idle");
      return;
    }

    if (eligibility === undefined) {
      setClaimStatus("checking");
      return;
    }

    if (eligibility.eligible) {
      setClaimStatus("eligible");
    } else {
      setClaimStatus("ineligible");
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

  const handleClaim = () => {
    if (!walletAddress || !eligibility?.eligible) return;

    // Show processing lightbox (NMKRPayLightbox will handle opening payment window)
    setShowLightbox(true);
    setClaimStatus("processing");
  };

  // Don't show banner if not connected
  if (claimStatus === "idle" || claimStatus === "checking") return null;

  // Debug override: force show claimed text if debug state is 'claimed'
  if (debugClaimState === 'claimed') {
    return (
      <div className="mb-4 text-center">
        <p className="text-green-400 text-sm">
          ✓ You claimed your Phase 1 commemorative NFT on {formatClaimDate(Date.now())}
        </p>
      </div>
    );
  }

  // Don't show banner if ineligible (unless debug unclaimed override)
  if (claimStatus === "ineligible" && debugClaimState !== 'unclaimed') return null;

  // Eligible - show claim banner with button
  return (
    <>
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
              onClick={handleClaim}
              isActive={true}
              variant="yellow"
              alwaysOn={true}
              hideIcon={true}
              className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
            />
          </div>
        </div>
      </div>

      {/* NMKR Payment Lightbox */}
      {showLightbox && (
        <NMKRPayLightbox
          walletAddress={walletAddress}
          onClose={() => {
            setShowLightbox(false);
            setClaimStatus("eligible");
          }}
        />
      )}
    </>
  );
}
