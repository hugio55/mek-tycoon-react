'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useDemoWallet } from './DemoWalletContext';

interface UserContextType {
  userId: string | null;
  isConnected: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { walletAddress, isConnected } = useDemoWallet();

  const value: UserContextType = {
    userId: walletAddress,
    isConnected,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
