import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mek Tycoon',
  description: 'Industrial idle game with collectible Mek NFTs',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout completely overrides the root layout
  // No navigation, no global background, pure landing page
  return children;
}
