"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import Navigation from "@/components/Navigation";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen bg-black">
        <div className="max-w-[900px] mx-auto px-5">
          <Navigation />
          {children}
        </div>
      </div>
    </ConvexProvider>
  );
}