/**
 * Database Switchable Query Wrapper
 *
 * Allows querying from either Trout (dev) or Sturgeon (production) databases
 * Used in admin panels for monitoring both environments
 *
 * 🚨 SAFETY: Sturgeon queries are READ ONLY
 */

import { ReactNode } from 'react';
import { ConvexProvider, useQuery } from 'convex/react';
import { sturgeonClient } from '@/lib/sturgeonClient';
import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface DatabaseSwitchableQueryProps {
  selectedDatabase: 'trout' | 'sturgeon';
  troutClient: ConvexReactClient;
  children: (data: {
    wallets: any;
    isLoading: boolean;
  }) => ReactNode;
  walletsLoaded: boolean;
}

function WalletsQueryInner({ walletsLoaded }: { walletsLoaded: boolean }) {
  const wallets = useQuery(
    api.adminVerificationReset.getAllWallets,
    walletsLoaded ? undefined : "skip"
  );

  return null; // This component just provides the query
}

export function DatabaseSwitchableWalletsQuery({
  selectedDatabase,
  troutClient,
  walletsLoaded,
  children
}: DatabaseSwitchableQueryProps) {
  const client = selectedDatabase === 'sturgeon' ? sturgeonClient : troutClient;

  return (
    <ConvexProvider client={client}>
      <WalletsQueryWrapper walletsLoaded={walletsLoaded}>
        {children}
      </WalletsQueryWrapper>
    </ConvexProvider>
  );
}

function WalletsQueryWrapper({
  walletsLoaded,
  children
}: {
  walletsLoaded: boolean;
  children: (data: { wallets: any; isLoading: boolean }) => ReactNode;
}) {
  const wallets = useQuery(
    api.adminVerificationReset.getAllWallets,
    walletsLoaded ? undefined : "skip"
  );

  return <>{children({ wallets, isLoading: wallets === undefined })}</>;
}
