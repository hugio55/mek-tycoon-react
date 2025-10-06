import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import "@/styles/special-buttons.css";
import "@/styles/typography-system.css";
import { Providers } from "./providers";
import { GlobalClickSound } from "@/components/GlobalClickSound";
import GlobalBackground from "@/components/GlobalBackground";
import { DemoModeWrapper } from "@/components/DemoModeWrapper";
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
  description: "This website is for testing purposes only. Mek income is an element of a future product and we are gathering statistics and feedback. Bugs or comments? Head here: https://discord.gg/kHkvnPbfmm",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  icons: {
    icon: '/fav2.png',
    apple: '/fav2.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mek Tycoon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100%', overflowX: 'hidden' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased min-h-screen overflow-x-hidden`}
        style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}
      >
        {/* Global background with animated stars and particles */}
        <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100vh', overflow: 'hidden', zIndex: -1 }}>
          <GlobalBackground />
        </div>
        
        {/* Content layer */}
        <div className="relative z-10">
          <GlobalClickSound />
          <DemoModeWrapper>
            <Providers>{children}</Providers>
          </DemoModeWrapper>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
