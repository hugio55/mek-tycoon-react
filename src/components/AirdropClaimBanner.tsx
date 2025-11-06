'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import HolographicButton from '@/components/ui/IndustrialButtons/HolographicButton';
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

type BannerVariation = "industrial" | "elegant" | "modern";

export default function AirdropClaimBanner({ userId, walletAddress }: AirdropClaimBannerProps) {
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [showLightbox, setShowLightbox] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [debugClaimState, setDebugClaimState] = useState<'claimed' | 'unclaimed' | null>(null);
  const [bannerVariation, setBannerVariation] = useState<BannerVariation>("industrial");
  const [showVariationPicker, setShowVariationPicker] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  const PRICE_ADA = 10;

  // Load banner variation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('banner_variation');
    if (saved === 'industrial' || saved === 'elegant' || saved === 'modern') {
      setBannerVariation(saved);
    }
  }, []);

  // Save banner variation to localStorage when changed
  const handleVariationChange = (variation: BannerVariation) => {
    setBannerVariation(variation);
    localStorage.setItem('banner_variation', variation);
  };

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
    console.log('[🎯CLAIM] AirdropClaimBanner state:', {
      walletAddress,
      eligibility,
      claimStatus
    });

    if (!walletAddress) {
      setClaimStatus("idle");
      setAlreadyClaimed(false);
      return;
    }

    if (eligibility === undefined) {
      setClaimStatus("checking");
      return;
    }

    if (eligibility.eligible) {
      setClaimStatus("eligible");
      setAlreadyClaimed(false);
    } else {
      // Check if ineligible because already claimed
      const claimed = (eligibility as any).alreadyClaimed === true;
      setAlreadyClaimed(claimed);
      setClaimStatus(claimed ? "eligible" : "ineligible"); // Show banner if already claimed
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
    if (!walletAddress || !eligibility?.eligible || alreadyClaimed) return;

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

  // Render variation selector (debug dropdown on right side)
  const renderVariationSelector = () => (
    <div className="fixed top-20 right-4 z-[9998]">
      <button
        onClick={() => setShowVariationPicker(!showVariationPicker)}
        className="bg-black/80 border border-gray-600 text-gray-300 px-3 py-2 rounded text-xs hover:bg-black/90 transition-colors"
      >
        Banner Style ▼
      </button>
      {showVariationPicker && (
        <div className="absolute top-full right-0 mt-1 bg-black/95 border border-gray-600 rounded shadow-xl min-w-[180px]">
          <button
            onClick={() => handleVariationChange("industrial")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/20 transition-colors ${
              bannerVariation === "industrial" ? "bg-cyan-500/30 text-cyan-300" : "text-gray-300"
            }`}
          >
            Industrial (Orbitron)
          </button>
          <button
            onClick={() => handleVariationChange("elegant")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-yellow-500/20 transition-colors ${
              bannerVariation === "elegant" ? "bg-yellow-500/30 text-yellow-300" : "text-gray-300"
            }`}
          >
            Elegant (Serif)
          </button>
          <button
            onClick={() => handleVariationChange("modern")}
            className={`block w-full text-left px-4 py-2 text-xs hover:bg-purple-500/20 transition-colors ${
              bannerVariation === "modern" ? "bg-purple-500/30 text-purple-300" : "text-gray-300"
            }`}
          >
            Modern (Sans)
          </button>
        </div>
      )}
    </div>
  );

  // VARIATION 1: Industrial (Original)
  const renderIndustrialVariation = () => (
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
          {alreadyClaimed ? (
            <button
              disabled
              className="w-full py-3 px-6 rounded bg-gray-600 text-gray-400 font-bold text-base tracking-[0.15em] cursor-not-allowed opacity-60"
            >
              ALREADY CLAIMED
            </button>
          ) : (
            <HolographicButton
              text="Claim Your NFT"
              onClick={handleClaim}
              isActive={true}
              variant="yellow"
              alwaysOn={true}
              hideIcon={true}
              className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
            />
          )}
        </div>
      </div>
    </div>
  );

  // VARIATION 2: Elegant (Serif font, gold theme)
  const renderElegantVariation = () => (
    <div
      className="mb-6 p-8 rounded-lg border-2"
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.2) 100%)',
        borderColor: '#f59e0b',
        boxShadow: '0 0 30px rgba(251, 191, 36, 0.5), inset 0 0 20px rgba(217, 119, 6, 0.2)'
      }}
    >
      <div className="text-center">
        <h3
          className="text-2xl mb-3"
          style={{
            fontFamily: "'Cinzel', serif",
            color: '#fef3c7',
            textShadow: '0 2px 8px rgba(251, 191, 36, 0.8)',
            letterSpacing: '0.08em',
            fontWeight: 600
          }}
        >
          Phase 1: Commemorative NFT
        </h3>
        <p
          className="mb-2"
          style={{
            fontFamily: "'Lora', serif",
            color: '#fde68a',
            lineHeight: '1.6',
            fontSize: '0.95rem',
            fontStyle: 'italic'
          }}
        >
          Awarded to early supporters who connected their wallet and accumulated gold
        </p>

        <p
          className="text-sm mb-5 opacity-80"
          style={{
            fontFamily: "'Lora', serif",
            color: '#fde68a',
            lineHeight: '1.5'
          }}
        >
          Price: {PRICE_ADA} ₳ • Sequential Edition • jpg.store Compatible
        </p>

        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={handleClaim}
            disabled={alreadyClaimed}
            className={`w-full py-3 px-8 rounded-md font-semibold text-base transition-all duration-300 ${alreadyClaimed ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'}`}
            style={{
              fontFamily: "'Cinzel', serif",
              background: alreadyClaimed ? '#4b5563' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: alreadyClaimed ? '#9ca3af' : '#1a1a1a',
              boxShadow: alreadyClaimed ? 'none' : '0 4px 15px rgba(251, 191, 36, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              border: alreadyClaimed ? '2px solid #6b7280' : '2px solid #fbbf24',
              letterSpacing: '0.1em'
            }}
          >
            {alreadyClaimed ? 'ALREADY CLAIMED' : 'CLAIM YOUR NFT'}
          </button>
        </div>
      </div>
    </div>
  );

  // VARIATION 3: Modern (Clean sans-serif, purple/pink theme)
  const renderModernVariation = () => (
    <div
      className="mb-6 p-6 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.3) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.5)',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(236, 72, 153, 0.2)'
      }}
    >
      <div className="text-center">
        <h3
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            background: 'linear-gradient(135deg, #e0e7ff 0%, #fbcfe8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}
        >
          Phase 1: Commemorative NFT
        </h3>
        <p
          className="text-sm mb-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: '#e9d5ff',
            lineHeight: '1.6',
            fontSize: '0.9rem',
            fontWeight: 400
          }}
        >
          Awarded to early supporters who connected their wallet and accumulated gold
        </p>

        <p
          className="text-xs mb-5"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: '#f3e8ff',
            opacity: 0.7,
            lineHeight: '1.5'
          }}
        >
          Price: {PRICE_ADA} ₳ • Sequential Edition • jpg.store Compatible
        </p>

        <div className="w-full max-w-xs mx-auto">
          <button
            onClick={handleClaim}
            disabled={alreadyClaimed}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${alreadyClaimed ? 'cursor-not-allowed opacity-60' : 'hover:brightness-110 active:scale-98'}`}
            style={{
              fontFamily: "'Inter', sans-serif",
              background: alreadyClaimed ? '#4b5563' : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              color: alreadyClaimed ? '#9ca3af' : '#ffffff',
              boxShadow: alreadyClaimed ? 'none' : '0 4px 20px rgba(168, 85, 247, 0.5)',
              border: alreadyClaimed ? '1px solid #6b7280' : 'none',
              letterSpacing: '0.03em'
            }}
          >
            {alreadyClaimed ? 'ALREADY CLAIMED' : 'Claim Your NFT'}
          </button>
        </div>
      </div>
    </div>
  );

  // Eligible - show claim banner with selected variation
  return (
    <>
      {renderVariationSelector()}

      {bannerVariation === "industrial" && renderIndustrialVariation()}
      {bannerVariation === "elegant" && renderElegantVariation()}
      {bannerVariation === "modern" && renderModernVariation()}

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
