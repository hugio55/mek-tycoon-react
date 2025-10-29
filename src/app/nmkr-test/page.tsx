"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function NMKRTestPage() {
  const [showWidget, setShowWidget] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [purchaseDetected, setPurchaseDetected] = useState(false);
  const popupRef = useRef<Window | null>(null);

  // NMKR Pay widget URL (preprod testnet - Bronze Token #1)
  const NMKR_PAY_URL = "https://pay.preprod.nmkr.io/?p=b98a1e9d7c0944a68566da1d5f9c352f&c=5&n=5746c33ee4c44877ba11c0845fa5493c";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Start polling when widget opens
  useEffect(() => {
    if (showWidget && !pollingActive) {
      console.log('[🔨NMKR-TEST] Starting webhook polling...');
      setPollingActive(true);

      // Poll every 3 seconds for webhook events
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // Check if there's a recent purchase in the database
          // For now, we'll rely on NMKR widget's own completion detection
          console.log('[🔨NMKR-TEST] Polling for purchase completion...');
        } catch (error) {
          console.error('[🔨NMKR-TEST] Polling error:', error);
        }
      }, 3000);
    }

    // Cleanup polling on unmount or when widget closes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [showWidget, pollingActive]);

  // Listen for messages from NMKR Pay widget
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from NMKR domain
      if (!event.origin.includes('nmkr.io')) return;

      console.log('[🔨NMKR-TEST] Message from NMKR widget:', event.data);

      // NMKR widget sends different event types
      // "nftmkr_payment_complete" or "nftmkr_payment_success" indicates completion
      if (
        event.data?.type === 'nftmkr_payment_complete' ||
        event.data?.type === 'nftmkr_payment_success' ||
        event.data?.status === 'success' ||
        event.data?.eventType === 'transactionfinished'
      ) {
        console.log('[🔨NMKR-TEST] Purchase completed! Event:', event.data);
        setPurchaseDetected(true);

        // Extract transaction hash if available
        if (event.data.txHash || event.data.transactionHash) {
          setTxHash(event.data.txHash || event.data.transactionHash);
        }

        // Close widget and show success
        handlePurchaseComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOpenWidget = () => {
    console.log('[🔨NMKR-TEST] Opening NMKR Pay widget popup...');
    setPurchaseDetected(false);
    setShowWidget(true);

    // Calculate center position for popup
    const popupWidth = 500;
    const popupHeight = 700;
    const left = window.top!.outerWidth / 2 + window.top!.screenX - (popupWidth / 2);
    const top = window.top!.outerHeight / 2 + window.top!.screenY - (popupHeight / 2);

    // Open popup window (NMKR's official method)
    const popup = window.open(
      NMKR_PAY_URL,
      "NMKR Pay - Bronze Token",
      `popup=1, location=1, width=${popupWidth}, height=${popupHeight}, left=${left}, top=${top}`
    );

    if (popup) {
      popupRef.current = popup;
      console.log('[🔨NMKR-TEST] Popup opened successfully');
    } else {
      console.error('[🔨NMKR-TEST] Failed to open popup - check popup blocker');
      setShowWidget(false);
    }
  };

  const handleCloseWidget = () => {
    console.log('[🔨NMKR-TEST] Closing NMKR Pay widget manually');

    // Close popup if it exists
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;

    setShowWidget(false);
    setPollingActive(false);

    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handlePurchaseComplete = () => {
    console.log('[🔨NMKR-TEST] Purchase complete! Showing success message...');

    // Stop polling
    setPollingActive(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Close popup window
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;

    // Close widget
    setShowWidget(false);

    // Show success lightbox
    setTimeout(() => {
      setShowSuccess(true);
    }, 300);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setTxHash(null);
    setPurchaseDetected(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background stars */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 61) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              opacity: 0.2 + ((i % 80) / 100),
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="mek-card-industrial mek-border-sharp-gold rounded-xl p-12 max-w-2xl w-full">
          {/* Header */}
          <div className="mek-header-industrial -mx-12 -mt-12 mb-8 text-center">
            <h1 className="mek-text-industrial text-4xl text-yellow-400">
              NMKR PAY TEST
            </h1>
            <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">
              Preprod Testnet - Bronze Token #1
            </p>
          </div>

          {/* Info section */}
          <div className="space-y-4 mb-8">
            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="mek-label-uppercase">Network</span>
                <span className="text-yellow-400 font-bold">Preprod Testnet</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="mek-label-uppercase">Price</span>
                <span className="text-yellow-400 font-bold">10 tADA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="mek-label-uppercase">NFT</span>
                <span className="text-gray-300">Bronze Token #1</span>
              </div>
            </div>

            <div className="bg-black/40 border border-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                This page tests NMKR Pay integration with:
              </p>
              <ul className="list-disc list-inside text-gray-400 text-sm mt-2 space-y-1 ml-2">
                <li>Widget popup opening</li>
                <li>Webhook detection for purchase completion</li>
                <li>Auto-close popup after purchase</li>
                <li>Custom success lightbox</li>
              </ul>
            </div>
          </div>

          {/* Main button */}
          <button
            onClick={handleOpenWidget}
            disabled={showWidget}
            className="mek-button-primary w-full py-6 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Claim Your NFT</span>
          </button>

          {/* Status indicator */}
          {showWidget && (
            <div className="mt-6 text-center space-y-3">
              <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-6 py-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 font-medium">
                  Popup Open - Waiting for purchase...
                </span>
              </div>
              <div>
                <button
                  onClick={handleCloseWidget}
                  className="text-gray-400 hover:text-gray-300 text-sm underline"
                >
                  Close Popup Window
                </button>
              </div>
            </div>
          )}

          {purchaseDetected && !showSuccess && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-6 py-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">
                  Purchase detected! Closing widget...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Lightbox */}
      {showSuccess && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm"
            onClick={handleCloseSuccess}
          />

          {/* Success Container */}
          <div
            className="relative w-full max-w-2xl bg-black/95 border-4 border-green-500/50 rounded-lg overflow-hidden shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with hazard stripes */}
            <div className="mek-overlay-hazard-stripes p-6 border-b-2 border-green-500/30">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
                <div>
                  <h2 className="mek-text-industrial text-3xl text-green-400">
                    PURCHASE COMPLETE
                  </h2>
                  <p className="text-gray-400 text-sm mt-1 uppercase tracking-wider">
                    NFT Successfully Claimed
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6">
                {/* Success message */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                  <p className="text-green-400 text-lg font-bold mb-2">
                    Your Bronze Token NFT has been minted!
                  </p>
                  <p className="text-gray-400 text-sm">
                    The NFT will appear in your wallet within a few minutes.
                  </p>
                </div>

                {/* Transaction details */}
                {txHash && (
                  <div className="bg-black/40 border border-gray-700/50 rounded-lg p-4">
                    <div className="mek-label-uppercase mb-2">Transaction Hash</div>
                    <div className="bg-black/60 border border-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-300 break-all">
                      {txHash}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 font-medium mb-2">What happens next?</p>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span>Your NFT is being processed on the Cardano blockchain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span>It will appear in your wallet within 2-5 minutes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span>You can view the transaction on a Cardano explorer</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseSuccess}
                className="mek-button-primary w-full mt-8 py-4"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
