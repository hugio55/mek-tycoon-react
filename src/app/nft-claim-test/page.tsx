'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import CommemorativeNFTBanner from '@/components/CommemorativeNFTBanner';
import AirdropClaimBanner from '@/components/AirdropClaimBanner';

export default function NFTClaimTestPage() {
  const [showPaid, setShowPaid] = useState(true);
  const [showFree, setShowFree] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  // Mutation to get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('connectedWallet');
    if (storedWallet) {
      setWalletAddress(storedWallet);

      // Get or create user for this wallet
      getOrCreateUser({ walletAddress: storedWallet })
        .then(user => {
          if (user) {
            setUserId(user._id as Id<"users">);
          }
        })
        .catch(err => console.error('Error getting user:', err));
    }
  }, [getOrCreateUser]);

  return (
    <div className="min-h-screen p-8 bg-black">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">
          NFT Claiming System Test
        </h1>

        <div className="bg-black/50 border-2 border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">System Status</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">User ID: </span>
              <span className="text-white">{userId || 'Not connected'}</span>
            </div>
            <div>
              <span className="text-gray-400">Wallet: </span>
              <span className="text-white">{walletAddress ? `${walletAddress.slice(0, 15)}...` : 'Not connected'}</span>
            </div>
            <div>
              <span className="text-gray-400">NMKR Project: </span>
              <span className="text-white">
                {process.env.NEXT_PUBLIC_NMKR_PROJECT_ID === 'YOUR_TESTNET_PROJECT_ID_HERE'
                  ? '⚠️ Not configured'
                  : `✅ ${process.env.NEXT_PUBLIC_NMKR_PROJECT_ID}`}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Network: </span>
              <span className="text-white">{process.env.NEXT_PUBLIC_NMKR_NETWORK || 'testnet'}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-black/50 border-2 border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Setup Instructions</h2>

          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>
              <strong>NMKR Project Already Configured:</strong> Using testnet project ID{' '}
              <code className="text-yellow-400">{process.env.NEXT_PUBLIC_NMKR_PROJECT_ID}</code>
            </li>
            <li>
              <strong>Wallet Connection:</strong> Connect your wallet from the main site first,
              then return to this page
            </li>
            <li>
              <strong>Test Purchase:</strong> Use the banner below to test the payment flow
            </li>
            <li>
              <strong>NMKR Testnet:</strong> You'll need test ADA on Cardano preprod testnet
            </li>
          </ol>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowPaid(!showPaid)}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              showPaid
                ? 'bg-cyan-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Paid NFT (NMKR) - {showPaid ? 'Visible' : 'Hidden'}
          </button>

          <button
            onClick={() => setShowFree(!showFree)}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              showFree
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Free Airdrop - {showFree ? 'Visible' : 'Hidden'}
          </button>
        </div>

        {/* Test Data Display */}
        <div className="bg-black/50 border-2 border-yellow-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Test Flow</h2>

          <div className="space-y-4 text-gray-300">
            <div className="p-4 bg-black/50 rounded">
              <h3 className="font-bold text-cyan-400 mb-2">1. Paid NFT (5 ADA)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User clicks "MINT COMMEMORATIVE NFT" button</li>
                <li>NMKR payment window opens</li>
                <li>User pays 5 test ADA (preprod network)</li>
                <li>NMKR handles minting and delivery</li>
                <li>Banner disappears after purchase initiated</li>
              </ul>
            </div>

            <div className="p-4 bg-black/50 rounded">
              <h3 className="font-bold text-green-400 mb-2">2. Free Airdrop</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User clicks "Claim Your NFT" button</li>
                <li>Modal opens for address submission</li>
                <li>User enters Cardano receive address</li>
                <li>Address is saved to database</li>
                <li>Admin manually processes via NMKR later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Banners */}
      {showPaid && userId && walletAddress && (
        <CommemorativeNFTBanner
          userId={userId as any}
          walletAddress={walletAddress}
        />
      )}

      {showFree && userId && walletAddress && (
        <AirdropClaimBanner
          userId={userId}
          walletAddress={walletAddress}
        />
      )}

      {/* No wallet message */}
      {(!userId || !walletAddress) && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg max-w-md">
          <p className="text-red-400 mb-2 font-bold">
            Wallet Not Connected
          </p>
          <p className="text-red-300 text-sm">
            Please connect your wallet from the main site (Hub page) first, then return to this test page.
          </p>
        </div>
      )}
    </div>
  );
}