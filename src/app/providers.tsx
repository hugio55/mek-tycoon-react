"use client";

import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState } from "react";
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
  const [isBypassed, setIsBypassed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Check if loader is bypassed based on environment (client-only, after hydration)
  useEffect(() => {
    setHasMounted(true);

    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');

    const settingKey = isLocalhost ? 'disablePageLoaderLocalhost' : 'disablePageLoaderProduction';
    setIsBypassed(localStorage.getItem(settingKey) === 'true');
  }, []);

  // CRITICAL: Always render with wrapper to prevent FOUC
  // Start with opacity 0 and only show after mounting and checking bypass
  const shouldShow = hasMounted && (isBypassed || !isLoading);

  return (
    <div
      style={{
        opacity: shouldShow ? 1 : 0,
        transition: hasMounted && !isBypassed ? `opacity ${TIMING.FADE_DURATION}ms ease-out` : 'none',
        pointerEvents: shouldShow ? 'auto' : 'none',
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
  const isLandingPage = pathname === "/landing";

  // Show unified header on all pages except welcome, talent-builder, and landing
  const showHeader = !isWelcomePage && !isTalentBuilder && !isLandingPage;

  return (
    <LoaderProvider>
      <ConvexProviderWithLoader client={convex}>
        <DemoWalletProvider>
          <UserProvider>
            <EssenceProviderWrapper>
              <SoundProvider>
                <ContentWithLoadingState>
                  <div className={showHeader ? "min-h-screen relative" : "min-h-screen relative w-full"} style={!showHeader ? { margin: 0, padding: 0, width: '100vw', maxWidth: '100vw' } : undefined}>
                    {showHeader ? (
                      // Pages with header - wrapped in centered container
                      <div className="max-w-7xl mx-auto relative px-4 sm:px-8">
                        <UnifiedHeader />
                        <div className="relative z-10 pt-16 sm:pt-20">
                          {children}
                        </div>
                      </div>
                    ) : (
                      // Pages without header - no wrapper, full viewport
                      <div className="relative z-10 w-full" style={{ margin: 0, padding: 0, width: '100vw', maxWidth: '100vw' }}>
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