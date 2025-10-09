import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "../globals.css";
import "@/styles/special-buttons.css";
import "@/styles/typography-system.css";

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
  title: "Corporation - Mek Tycoon",
  description: "View corporation details and Mek collection",
};

export default function CorpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
        style={{ margin: 0, padding: 0, backgroundColor: '#000000' }}
      >
        {children}
      </body>
    </html>
  );
}
