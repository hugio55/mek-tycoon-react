"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import UnifiedHeader from "@/components/UnifiedHeader";
import { SoundProvider } from "@/contexts/SoundContext";
import { DemoWalletProvider, useDemoWallet } from "@/contexts/DemoWalletContext";
import { EssenceProvider } from "@/contexts/EssenceContext";

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

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Pages that should NOT have the header
  const isWelcomePage = pathname === "/";
  const isTalentBuilder = pathname === "/talent-builder";

  // Show unified header on all pages except welcome and talent-builder
  const showHeader = !isWelcomePage && !isTalentBuilder;

  return (
    <ConvexProvider client={convex}>
      <DemoWalletProvider>
        <EssenceProviderWrapper>
          <SoundProvider>
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
          </SoundProvider>
        </EssenceProviderWrapper>
      </DemoWalletProvider>
    </ConvexProvider>
  );
}