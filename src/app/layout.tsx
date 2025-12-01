// WeakRef polyfill for iOS 12-14 (must be first import)
import '@/polyfills/weakref';

// Force cache bust: fabulous-sturgeon-691 deployment
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Orbitron, Inter, Cinzel, Lora, Rajdhani, Space_Grotesk, Exo_2, Saira_Condensed, Teko, Abel, Josefin_Sans, Economica, Advent_Pro, Archivo_Narrow, Electrolize, Audiowide, Michroma, Play, Quantico, Saira } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@/styles/special-buttons.css";
import "@/styles/typography-system.css";
import { Providers } from "./providers";
import GlobalBackground from "@/components/GlobalBackground";
import { DemoModeWrapper } from "@/components/DemoModeWrapper";
import NavigationBar from "@/components/NavigationBar";
import GlobalLightboxHandler from "@/components/GlobalLightboxHandler";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";
// SessionCleanup removed - was clearing wallet sessions on every page load, causing auto-disconnect
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const exo2 = Exo_2({
  variable: "--font-exo-2",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500"],
});

const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const abel = Abel({
  variable: "--font-abel",
  subsets: ["latin"],
  weight: ["400"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500"],
});

const economica = Economica({
  variable: "--font-economica",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const adventPro = Advent_Pro({
  variable: "--font-advent-pro",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500"],
});

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const electrolize = Electrolize({
  variable: "--font-electrolize",
  subsets: ["latin"],
  weight: ["400"],
});

const audiowide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: ["400"],
});

const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin"],
  weight: ["400"],
});

const play = Play({
  variable: "--font-play",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const quantico = Quantico({
  variable: "--font-quantico",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
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
  maximumScale: 5,
  userScalable: true,
  minimumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100vw', height: 'auto', overflowX: 'hidden', overflowY: 'scroll', backgroundColor: '#0a0a0a' }} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${inter.variable} ${cinzel.variable} ${lora.variable} ${rajdhani.variable} ${spaceGrotesk.variable} ${exo2.variable} ${sairaCondensed.variable} ${teko.variable} ${abel.variable} ${josefinSans.variable} ${economica.variable} ${adventPro.variable} ${archivoNarrow.variable} ${electrolize.variable} ${audiowide.variable} ${michroma.variable} ${play.variable} ${quantico.variable} ${saira.variable} antialiased min-h-screen overflow-x-hidden overflow-y-scroll`}
        style={{ backgroundColor: 'transparent', width: '100vw', maxWidth: '100vw', height: 'auto', margin: 0, padding: 0 }}
      >
        {/* Content layer */}
        <div className="relative z-10">
          <DemoModeWrapper>
            <Providers>
              {/* Global background with animated stars and particles */}
              <GlobalBackground />

              {/* SessionCleanup removed - was clearing wallet sessions on every page load */}
              <PageLoadingOverlay />
              <NavigationBar />
              <GlobalLightboxHandler />
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
