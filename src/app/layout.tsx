// Force cache bust: fabulous-sturgeon-691 deployment
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@/styles/special-buttons.css";
import "@/styles/typography-system.css";
import { Providers } from "./providers";
import GlobalBackground from "@/components/GlobalBackground";
import { DemoModeWrapper } from "@/components/DemoModeWrapper";
import NavigationBar from "@/components/NavigationBar";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Mek Employment",
  description: "This website is for testing a core mechanic of a future Over Exposed product. It is not an actual game and it offers no rewards. Bugs or comments? Head here: https://discord.gg/kHkvnPbfmm",
  icons: {
    icon: '/fav2.png',
  },
  other: {
    'build-timestamp': new Date().toISOString(),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100vw', overflowX: 'hidden' }} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased min-h-screen overflow-x-hidden`}
        style={{ backgroundColor: '#0a0a0a', width: '100vw', maxWidth: '100vw', margin: 0, padding: 0 }}
      >
        {/* Global background with animated stars and particles */}
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -1 }}>
          <GlobalBackground />
        </div>
        
        {/* Content layer */}
        <div className="relative z-10">
          <DemoModeWrapper>
            <Providers>
              <NavigationBar />
              {children}
            </Providers>
          </DemoModeWrapper>
        </div>
        <SpeedInsights />

        {/* NMKR Payment Widget Script */}
        <Script
          src="https://pay.nmkr.io/sdk/v2/latest.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
