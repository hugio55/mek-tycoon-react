'use client'

import { useState, useEffect } from 'react';
import {
  isMobileDevice,
  detectAvailableMobileWallets,
  getMobileWalletDisplayName,
  openMobileWallet,
  type MobileWalletType,
} from '@/lib/mobileWalletSupport';

interface MobileWalletConnectProps {
  dappUrl: string;
  onWalletSelected: (walletType: MobileWalletType) => void;
  onError?: (error: Error) => void;
}

export default function MobileWalletConnect({
  dappUrl,
  onWalletSelected,
  onError,
}: MobileWalletConnectProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<MobileWalletType | null>(null);
  const [availableWallets, setAvailableWallets] = useState<MobileWalletType[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  const isMobile = isMobileDevice();

  // Detect available wallets on mount
  useEffect(() => {
    if (isMobile) {
      setIsDetecting(true);
      detectAvailableMobileWallets()
        .then(wallets => {
          setAvailableWallets(wallets);
          setIsDetecting(false);
        })
        .catch(error => {
          console.error('[Mobile Wallet Detection] Error:', error);
          setIsDetecting(false);
        });
    }
  }, [isMobile]);

  if (!isMobile) {
    return null;
  }

  const handleWalletClick = async (walletType: MobileWalletType) => {
    setIsOpening(true);
    setSelectedWallet(walletType);

    try {
      // Notify parent component
      onWalletSelected(walletType);

      // Try to open the wallet app
      await openMobileWallet(walletType, dappUrl);

      // If successful, the app should open
      console.log(`[Mobile Wallet] Successfully opened ${walletType}`);
    } catch (error) {
      console.error(`[Mobile Wallet] Failed to open ${walletType}:`, error);

      if (onError) {
        onError(
          error instanceof Error
            ? error
            : new Error(`Failed to open ${walletType} wallet`)
        );
      }
    } finally {
      setIsOpening(false);
      setSelectedWallet(null);
    }
  };

  // Wallet icons mapping (can be customized)
  const walletIcons: Record<MobileWalletType, string> = {
    eternl: '/wallet-icons/eternl.png',
    flint: '/wallet-icons/flint.png',
    typhon: '/wallet-icons/typhon.png',
    vespr: '/wallet-icons/vespr.png',
    nufi: '/wallet-icons/nufi.png',
    yoroi: '/wallet-icons/yoroi.png',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-yellow-500/20"></div>
        <span className="text-xs text-yellow-500/60 uppercase tracking-wider font-['Orbitron']">
          Mobile Wallets
        </span>
        <div className="h-px flex-1 bg-yellow-500/20"></div>
      </div>

      {isDetecting ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
            <p className="text-xs text-yellow-500/60 font-['Orbitron']">Detecting wallets...</p>
          </div>
        </div>
      ) : availableWallets.length === 0 ? (
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded">
          <p className="text-sm text-yellow-500/70 text-center font-['Orbitron']">
            No Cardano wallet apps detected on your device.
          </p>
          <p className="text-xs text-yellow-500/50 text-center font-['Orbitron'] mt-2">
            Please install Eternl, Flint, Typhon, Vespr, NuFi, or Yoroi from your app store.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableWallets.map((walletType) => {
          const isCurrentlyOpening = isOpening && selectedWallet === walletType;

          return (
            <button
              key={walletType}
              onClick={() => handleWalletClick(walletType)}
              disabled={isOpening}
              className="group relative bg-black/30 border border-yellow-500/20 text-yellow-500 px-4 py-3 sm:px-6 sm:py-4 transition-all hover:bg-yellow-500/5 hover:border-yellow-500/40 active:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider sm:tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm overflow-hidden min-h-[48px] touch-manipulation"
              style={{
                touchAction: 'manipulation',
              }}
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Content */}
              <div className="relative flex items-center justify-center gap-2">
                {/* Wallet icon */}
                <div className="w-6 h-6 relative flex-shrink-0">
                  <img
                    src={walletIcons[walletType]}
                    alt={getMobileWalletDisplayName(walletType)}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to text if icon fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Wallet name */}
                <span className="text-sm sm:text-base">
                  {isCurrentlyOpening ? 'Opening...' : getMobileWalletDisplayName(walletType)}
                </span>

                {/* Loading indicator */}
                {isCurrentlyOpening && (
                  <div className="ml-2">
                    <div className="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-500/40 group-hover:border-yellow-500/60 transition-colors"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-500/40 group-hover:border-yellow-500/60 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-500/40 group-hover:border-yellow-500/60 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-500/40 group-hover:border-yellow-500/60 transition-colors"></div>
            </button>
          );
        })}
        </div>
      )}

      {/* Instructions - only show if wallets are available */}
      {!isDetecting && availableWallets.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded">
          <p className="text-xs text-yellow-500/70 text-center font-['Orbitron']">
            Tap a wallet to open the app and connect
          </p>
        </div>
      )}
    </div>
  );
}
