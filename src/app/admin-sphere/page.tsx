'use client';

export default function AdminSpherePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-gray-900 border-4 border-yellow-500 shadow-2xl shadow-yellow-500/30 rounded-lg overflow-hidden">
        <iframe
          src="/games/sphere-selector/index.html"
          className="w-full h-full border-0"
          title="Sphere Selector Game"
        />
      </div>
    </div>
  );
}