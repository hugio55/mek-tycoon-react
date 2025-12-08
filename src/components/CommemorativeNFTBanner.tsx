'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import HolographicButton from '@/components/ui/IndustrialButtons/HolographicButton';
import { extractPaymentAddress, getWalletApi } from '@/lib/walletAddressExtraction';

interface CommemorativeNFTBannerProps {
  userId: Id<"users"> | null;
  walletAddress: string | null;
  walletName?: string;
}

export default function CommemorativeNFTBanner({ userId, walletAddress, walletName }: CommemorativeNFTBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get NMKR configuration from environment
  const NMKR_PROJECT_ID = process.env.NEXT_PUBLIC_NMKR_PROJECT_ID;
  const NMKR_NETWORK = process.env.NEXT_PUBLIC_NMKR_NETWORK || 'testnet';
  const IS_TESTNET = process.env.NEXT_PUBLIC_TESTNET_MODE === 'true';

  // Queries
  const eligibility = useQuery(
    api.commemorative.checkEligibility,
    walletAddress && userId ? { walletAddress, userId } : "skip"
  );

  const userPurchases = useQuery(
    api.commemorative.getUserPurchases,
    userId ? { userId } : "skip"
  );

  // Mutations
  const recordPurchase = useMutation(api.commemorative.recordPurchase);

  // Extract payment address when wallet is connected
  useEffect(() => {
    async function extractAddress() {
      if (walletName && walletAddress) {
        try {
          const api = await getWalletApi(walletName);
          if (api) {
            const address = await extractPaymentAddress(api);
            setPaymentAddress(address);
          }
        } catch (err) {
          console.error('Failed to extract payment address:', err);
        }
      }
    }
    extractAddress();
  }, [walletName, walletAddress]);

  // Don't show banner if NMKR not configured
  if (!NMKR_PROJECT_ID || NMKR_PROJECT_ID === 'YOUR_TESTNET_PROJECT_ID_HERE') {
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg max-w-md">
        <p className="text-yellow-400 text-sm">
          NMKR integration pending configuration. Please add your NMKR project ID to .env.local
        </p>
      </div>
    );
  }

  // Don't show if user not eligible or already purchased
  if (!eligibility?.eligible) return null;
  if (userPurchases && userPurchases.some(p => p.status === 'completed')) {
    return null; // User already has the NFT
  }

  const handlePurchaseClick = async () => {
    if (!userId || !walletAddress || !paymentAddress) {
      setError('Wallet not properly connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Record the purchase intent in database
      const purchase = await recordPurchase({
        userId,
        walletAddress,
        paymentAddress: paymentAddress,
        campaignName: 'commemorative-token-1',
        nmkrProjectId: NMKR_PROJECT_ID,
        goldSnapshot: eligibility.goldAmount || 0,
        mekCount: eligibility.mekCount || 0,
      });

      // Open NMKR payment widget
      const nmkrUrl = `https://pay.nmkr.io/?p=${NMKR_PROJECT_ID}&c=1`;

      // Add custom metadata to pass our purchase ID
      const urlWithMetadata = `${nmkrUrl}&metadata=${encodeURIComponent(JSON.stringify({
        purchaseId: purchase._id,
        userId: userId,
        walletAddress: walletAddress
      }))}`;

      // Open NMKR payment popup
      const paymentWindow = window.open(
        urlWithMetadata,
        'NMKR Payment',
        'width=500,height=800,left=100,top=100'
      );

      // Monitor payment window
      const checkInterval = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkInterval);
          setIsLoading(false);
          // Check if payment was successful by querying updated purchase status
          // The webhook should have updated it by now
          checkPaymentStatus(purchase._id);
        }
      }, 1000);

    } catch (err) {
      console.error('Purchase error:', err);
      setError('Failed to initiate purchase. Please try again.');
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (purchaseId: string) => {
    // In a real implementation, query the purchase status
    // For now, show a message
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 5000);
  };

  const priceInAda = IS_TESTNET ? '5 tADA' : '5 ADA';
  const networkLabel = IS_TESTNET ? '(Testnet)' : '';

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-4 right-4 p-6 bg-black/90 border-2 border-cyan-500/50 rounded-lg max-w-md backdrop-blur-sm">
        <div className="relative">
          {/* Holographic effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 rounded-lg animate-pulse" />

          <div className="relative z-10">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
              Limited Edition NFT Available! {networkLabel}
            </h3>

            <p className="text-gray-300 text-sm mb-4">
              Celebrate your early participation in Mek Tycoon with an exclusive commemorative NFT.
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <span className="text-gray-400">Price: </span>
                <span className="text-cyan-400 font-bold">{priceInAda}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Your Meks: </span>
                <span className="text-green-400 font-bold">{eligibility?.mekCount || 0}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {!paymentAddress && (
              <div className="mb-4 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-sm">
                Extracting payment address from wallet...
              </div>
            )}

            <HolographicButton
              onClick={handlePurchaseClick}
              disabled={isLoading || !paymentAddress}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⚡</span>
                  Processing...
                </span>
              ) : (
                `Purchase NFT - ${priceInAda}`
              )}
            </HolographicButton>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by NMKR • One per wallet
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black/90 border-2 border-green-500 rounded-lg p-8 max-w-md">
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              Purchase Initiated!
            </h3>
            <p className="text-gray-300 mb-4">
              Your payment is being processed. You'll receive your NFT once the transaction is confirmed on the blockchain.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-green-500/20 border border-green-500 rounded text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
