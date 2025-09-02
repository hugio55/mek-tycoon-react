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
  
  return (
    <ConvexProvider client={convex}>
      <SoundProvider>
        <div className="min-h-screen bg-black relative">
          {isWelcomePage ? (
            // Welcome page without navigation
            children
          ) : (
            // All other pages with navigation
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