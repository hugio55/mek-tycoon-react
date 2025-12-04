"use client";

import MessagingSystemAdmin from "@/components/MessagingSystemAdmin";

export default function CommsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📡</div>
            <div>
              <h1
                className="text-2xl font-bold text-white tracking-wider"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                COMMUNICATIONS
              </h1>
              <p className="text-gray-400 text-sm">
                Secure messaging between corporations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <MessagingSystemAdmin />
      </div>
    </div>
  );
}
