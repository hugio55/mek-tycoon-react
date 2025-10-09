import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporation - Mek Tycoon",
  description: "View corporation details and Mek collection",
};

export default function CorpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
