"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import { SoundProvider } from "@/contexts/SoundContext";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWelcomePage = pathname === "/";
  const isTalentBuilder = pathname === "/talent-builder";
  const isMekRateLogging = pathname === "/mek-rate-logging";
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <ConvexProvider client={convex}>
      <SoundProvider>
        <div className="min-h-screen relative">
          {isWelcomePage || isTalentBuilder || isMekRateLogging ? (
            // Root page, talent builder, and mek-rate-logging without navigation
            children
          ) : isAdminPage ? (
            // Admin pages with full width layout
            <>
              <Navigation fullWidth />
              <div className="relative z-10">
                {children}
              </div>
            </>
          ) : (
            // All other pages with constrained width navigation
            <div className="max-w-[900px] mx-auto px-5 relative">
              <Navigation />
              <div className="relative z-10">
                {children}
              </div>
            </div>
          )}
        </div>
      </SoundProvider>
    </ConvexProvider>
  );
}