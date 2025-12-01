import { ConvexReactClient } from "convex/react";

declare global {
  interface Window {
    convex: ConvexReactClient;
  }
}

export {};
