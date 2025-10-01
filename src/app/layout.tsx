import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/special-buttons.css";
import { Providers } from "./providers";
import { GlobalClickSound } from "@/components/GlobalClickSound";
import GlobalBackground from "@/components/GlobalBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mek Tycoon",
  description: "This website is for testing purposes only. Mek income is an element of a future product and we are gathering statistics and feedback. Bugs or comments? Head here: https://discord.gg/kHkvnPbfmm",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {/* Global background with animated stars and particles */}
        <GlobalBackground />
        
        {/* Content layer */}
        <div className="relative z-10">
          <GlobalClickSound />
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
