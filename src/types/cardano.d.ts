interface CardanoWalletApi {
  enable(): Promise<any>;
  isEnabled(): Promise<boolean>;
  getNetworkId(): Promise<number>;
  getUtxos(): Promise<string[] | undefined>;
  getBalance(): Promise<string>;
  getUsedAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  signTx(tx: string, partialSign: boolean): Promise<string>;
  signData(address: string, payload: string): Promise<{ signature: string; key: string }>;
  submitTx(tx: string): Promise<string>;
  getCollateral(): Promise<string[] | undefined>;
  experimental?: {
    on(event: 'accountChange' | 'networkChange', callback: () => void): void;
    off(event: 'accountChange' | 'networkChange', callback: () => void): void;
  };
}

interface CardanoWallet {
  apiVersion: string;
  name: string;
  icon: string;
  enable(): Promise<CardanoWalletApi>;
  isEnabled(): Promise<boolean>;
}

declare global {
  interface Window {
    cardano?: {
      [key: string]: CardanoWallet;
      nami?: CardanoWallet;
      eternl?: CardanoWallet;
      flint?: CardanoWallet;
      yoroi?: CardanoWallet;
      typhon?: CardanoWallet;
      gerowallet?: CardanoWallet;
      nufi?: CardanoWallet;
    };
  }
}

export {};