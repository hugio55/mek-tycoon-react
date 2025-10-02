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

  // Wallet icons mapping
  const walletIcons: Record<MobileWalletType, string> = {
    eternl: '/wallet-icons/eternl.png',
    flint: '/wallet-icons/flint.png',
    typhon: '/wallet-icons/typhon.png',
    vespr: '/wallet-icons/vespr.png',
    nufi: '/wallet-icons/nufi.png',
    yoroi: '/wallet-icons/yoroi.png',
    lace: '/wallet-icons/lace.png',
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
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-yellow-500/20 border-t-yellow-500 border-r-yellow-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-2 border-yellow-500/10 rounded-full"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-yellow-500/80 font-['Orbitron'] font-bold uppercase tracking-wider">
                Scanning Device
              </p>
              <p className="text-xs text-yellow-500/50 font-['Orbitron']">
                Looking for installed wallets...
              </p>
            </div>
          </div>
        </div>
      ) : availableWallets.length === 0 ? (
        <div className="p-6 bg-black/40 border-2 border-yellow-500/30 rounded backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-base text-yellow-500/90 font-['Orbitron'] font-bold uppercase tracking-wider">
                No Wallets Found
              </p>
              <p className="text-sm text-yellow-500/60 font-['Orbitron'] leading-relaxed">
                No Cardano wallet apps detected on your device.
              </p>
            </div>
            <div className="w-full pt-2 border-t border-yellow-500/20">
              <p className="text-xs text-yellow-500/50 font-['Orbitron'] mb-2">
                Supported Wallets:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Eternl', 'Flint', 'Typhon', 'Vespr', 'NuFi', 'Yoroi', 'Lace'].map(name => (
                  <span key={name} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500/70 font-['Orbitron']">
                    {name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-yellow-500/40 font-['Orbitron'] mt-3">
                Install any wallet from your device's app store
              </p>
            </div>
          </div>
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
              className="group relative bg-black/40 border-2 border-yellow-500/30 text-yellow-500 px-4 py-4 sm:px-6 sm:py-5 transition-all hover:bg-yellow-500/10 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 active:bg-yellow-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider sm:tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm overflow-hidden min-h-[60px] touch-manipulation rounded"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Scan line animation for loading state */}
              {isCurrentlyOpening && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent animate-scan"></div>
                </div>
              )}

              {/* Content */}
              <div className="relative flex items-center justify-center gap-3">
                {/* Wallet icon */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 relative flex-shrink-0 transition-transform group-hover:scale-110">
                  <img
                    src={walletIcons[walletType]}
                    alt={getMobileWalletDisplayName(walletType)}
                    className="w-full h-full object-contain drop-shadow-lg"
                    onError={(e) => {
                      // Fallback to text if icon fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Wallet name */}
                <span className="text-sm sm:text-base flex-1 text-center">
                  {isCurrentlyOpening ? 'Opening Wallet...' : getMobileWalletDisplayName(walletType)}
                </span>

                {/* Loading indicator */}
                {isCurrentlyOpening && (
                  <div className="flex-shrink-0">
                    <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                      <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-transparent border-t-yellow-500 border-r-yellow-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Corner accents - more prominent */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/50 group-hover:border-yellow-500/80 transition-all duration-300"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50 group-hover:border-yellow-500/80 transition-all duration-300"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50 group-hover:border-yellow-500/80 transition-all duration-300"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/50 group-hover:border-yellow-500/80 transition-all duration-300"></div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-500/5 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>
            </button>
          );
        })}
        </div>
      )}

      {/* Instructions - only show if wallets are available */}
      {!isDetecting && availableWallets.length > 0 && (
        <div className="mt-4 p-4 bg-black/30 border-2 border-yellow-500/20 rounded backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-yellow-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-yellow-500/80 font-['Orbitron'] font-bold">How to Connect</p>
              <p className="text-xs text-yellow-500/60 font-['Orbitron'] leading-relaxed">
                Tap a wallet button above to open the app and approve the connection request
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
