/**
 * Maintenance Page Layout
 * Removes all navigation elements and shows only the maintenance message
 * Uses planet background from landing page
 */
export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Planet Background (same as landing page) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          opacity: 0.82, // +7% brightness boost
          zIndex: 0,
        }}
      />

      {/* Black overlay for depth */}
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: 1 }} />

      {/* Content */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
