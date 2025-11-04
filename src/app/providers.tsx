"use client";

import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import UnifiedHeader from "@/components/UnifiedHeader";
import { SoundProvider } from "@/contexts/SoundContext";
import { DemoWalletProvider, useDemoWallet } from "@/contexts/DemoWalletContext";
import { EssenceProvider } from "@/contexts/EssenceContext";
import { UserProvider } from "@/contexts/UserContext";
import { LoaderProvider, useLoaderContext } from "@/features/page-loader";
import { TIMING } from "@/features/page-loader/config/constants";
import { ConvexProviderWithLoader } from "@/providers/ConvexProviderWithLoader";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Inner component that uses the wallet context to provide essence context
function EssenceProviderWrapper({ children }: { children: ReactNode }) {
  const { walletAddress } = useDemoWallet();

  return (
    <EssenceProvider walletAddress={walletAddress}>
      {children}
    </EssenceProvider>
  );
}

// Component that wraps content and handles loading visibility
function ContentWithLoadingState({ children }: { children: ReactNode }) {
  const { isLoading } = useLoaderContext();

  return (
    <div
      style={{
        opacity: isLoading ? 0 : 1,
        transition: `opacity ${TIMING.FADE_DURATION}ms ease-out`,
        pointerEvents: isLoading ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages that should NOT have the header
  const isWelcomePage = pathname === "/";
  const isTalentBuilder = pathname === "/talent-builder";

  // Show unified header on all pages except welcome and talent-builder
  const showHeader = !isWelcomePage && !isTalentBuilder;

  return (
    <LoaderProvider>
      <ConvexProviderWithLoader client={convex}>
        <DemoWalletProvider>
          <UserProvider>
            <EssenceProviderWrapper>
              <SoundProvider>
                <ContentWithLoadingState>
                  <div className="min-h-screen relative">
                    {showHeader ? (
                      // Pages with header - wrapped in centered container
                      <div className="max-w-7xl mx-auto relative px-4 sm:px-8">
                        <UnifiedHeader />
                        <div className="relative z-10 pt-16 sm:pt-20">
                          {children}
                        </div>
                      </div>
                    ) : (
                      // Pages without header - no wrapper
                      <div className="relative z-10">
                        {children}
                      </div>
                    )}
                  </div>
                </ContentWithLoadingState>
              </SoundProvider>
            </EssenceProviderWrapper>
          </UserProvider>
        </DemoWalletProvider>
      </ConvexProviderWithLoader>
    </LoaderProvider>
  );
}