'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import CommemorativeNFTBanner from '@/components/CommemorativeNFTBanner';
import AirdropClaimBanner from '@/components/AirdropClaimBanner';
import { useState } from 'react';

export default function NFTClaimTestPage() {
  const { user } = useUser();
  const [showPaid, setShowPaid] = useState(true);
  const [showFree, setShowFree] = useState(false);

  // Get user ID and wallet from database
  const userData = useQuery(api.users.getCurrentUser, {
    clerkId: user?.id || "",
  });

  const walletAddress = userData?.primaryWallet || null;
  const userId = userData?._id || null;

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
                  : '✅ Configured'}
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
              <strong>Get NMKR Project ID:</strong> Go to{' '}
              <a href="https://studio.nmkr.io" target="_blank" className="text-blue-400 hover:underline">
                NMKR Studio
              </a>{' '}
              and create a testnet project
            </li>
            <li>
              <strong>Add to Environment:</strong> Update <code className="text-yellow-400">.env.local</code>:
              <pre className="bg-black/50 p-2 mt-2 rounded text-xs">
                NEXT_PUBLIC_NMKR_PROJECT_ID=your-project-id-here{'\n'}
                NMKR_WEBHOOK_SECRET=your-webhook-secret
              </pre>
            </li>
            <li>
              <strong>Configure Webhook:</strong> In NMKR Studio, set webhook URL to:
              <pre className="bg-black/50 p-2 mt-2 rounded text-xs">
                https://your-domain.com/api/nmkr-webhook
              </pre>
            </li>
            <li>
              <strong>Test Purchase:</strong> Use the banner below to test the payment flow
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
                <li>User clicks "Purchase NFT" button</li>
                <li>NMKR payment window opens</li>
                <li>User pays 5 ADA (or test ADA)</li>
                <li>Webhook receives confirmation</li>
                <li>Purchase status updates to "completed"</li>
                <li>NFT is minted and sent by NMKR</li>
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
          userId={userId}
          walletAddress={walletAddress}
          walletName="nami" // You might get this from your wallet context
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
        <div className="fixed bottom-4 right-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
          <p className="text-red-400">
            Please connect your wallet to test NFT claiming
          </p>
        </div>
      )}
    </div>
  );
}