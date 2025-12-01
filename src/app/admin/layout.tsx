// Force dynamic rendering to prevent prerender errors with Convex
export const dynamic = 'force-dynamic';

export default function AdminMasterDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
