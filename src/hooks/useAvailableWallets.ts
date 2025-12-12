import { useState, useEffect } from 'react';

export interface WalletInfo {
  name: string;
  icon: string;
  version: string;
  api: any;
}

export const useAvailableWallets = () => {
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectWallets = (): WalletInfo[] => {
    const wallets: WalletInfo[] = [];

    const isMobile = /android|iphone|ipad|ipod/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
    );

    if (isMobile) {
      // On mobile, show all major wallets as they use deep links
      const mobileWallets = [
        { name: 'Eternl', icon: '/wallet-icons/eternl.png' },
        { name: 'Flint', icon: '/wallet-icons/flint.png' },
        { name: 'Yoroi', icon: '/wallet-icons/yoroi.png' },
        { name: 'Vespr', icon: '/wallet-icons/vespr.png' },
        { name: 'Typhon', icon: '/wallet-icons/typhon.png' },
        { name: 'NuFi', icon: '/wallet-icons/nufi.png' },
        { name: 'Lace', icon: '/wallet-icons/lace.png' },
      ];

      mobileWallets.forEach(wallet => {
        wallets.push({
          name: wallet.name,
          icon: wallet.icon,
          version: 'mobile',
          api: null
        });
      });

      console.log('[WALLET DETECTION] Mobile device detected, showing all wallet options');
    } else if (typeof window !== 'undefined' && window.cardano) {
      // Desktop: Check for browser extensions
      const cardanoApi = window.cardano;
      const walletNames = ['lace', 'nami', 'eternl', 'flint', 'yoroi', 'typhon', 'gerowallet', 'nufi', 'vespr'];

      walletNames.forEach(name => {
        if (cardanoApi[name]) {
          wallets.push({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            icon: `/wallet-icons/${name}.png`,
            version: cardanoApi[name].apiVersion || '0.1.0',
            api: cardanoApi[name]
          });
        }
      });
    }

    console.log('[WALLET DETECTION]', {
      timestamp: new Date().toISOString(),
      walletsFound: wallets.length,
      walletNames: wallets.map(w => w.name),
      platform: isMobile ? 'mobile' : 'desktop',
      cardanoObject: typeof window !== 'undefined' && window.cardano ? Object.keys(window.cardano) : []
    });

    return wallets;
  };

  const refreshWallets = () => {
    setIsDetecting(true);
    const wallets = detectWallets();

    setAvailableWallets(prevWallets => {
      const hasChanged = prevWallets.length !== wallets.length ||
                        prevWallets.some((w, i) => w.name !== wallets[i]?.name);
      return hasChanged ? wallets : prevWallets;
    });

    setIsDetecting(false);
  };

  useEffect(() => {
    refreshWallets();
  }, []);

  return {
    availableWallets,
    isDetecting,
    refreshWallets,
    detectWallets
  };
};
