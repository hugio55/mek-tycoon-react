"use client";

import { useState } from "react";
import EssenceListingLightboxV1Clean from "@/components/EssenceListingLightbox-V1-Clean";
import EssenceListingLightboxV2Industrial from "@/components/EssenceListingLightbox-V2-Industrial";
import EssenceListingLightboxV3Tactical from "@/components/EssenceListingLightbox-V3-Tactical";
import EssenceListingLightboxV4TacticalYellow from "@/components/EssenceListingLightbox-V4-TacticalYellow";
import EssenceListingLightboxV5YellowGradient from "@/components/EssenceListingLightbox-V5-YellowGradient";

const DURATION_OPTIONS = [
  { days: 1, label: "1 Day", cost: 100 },
  { days: 3, label: "3 Days", cost: 200 },
  { days: 7, label: "7 Days", cost: 500 },
  { days: 14, label: "14 Days", cost: 800 },
  { days: 30, label: "30 Days", cost: 1500 },
];

const DEMO_OWNED_ESSENCE = [
  { name: "Bumblebee", amount: 3.5 },
  { name: "Bowling", amount: 1.0 },
  { name: "Blue Cheer", amount: 7.2 },
  { name: "Crystal Ball", amount: 0.5 },
  { name: "Disco Ball", amount: 12.3 },
];

export default function EssenceMarketDemoPage() {
  const [version, setVersion] = useState<"v1" | "v2" | "v3" | "v4" | "v5">("v5");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (data: any) => {
    console.log("Listing created:", data);
    alert(`Listing created!\n${data.amount} ${data.variation}\nPrice: ${data.price}g per unit\nDuration: ${data.duration} days`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Essence Listing Lightbox - Style Comparison
          </h1>
          <p className="text-gray-400">
            Test the five different aesthetic options
          </p>
        </div>

        {/* Version Selector */}
        <div className="mb-8 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-bold text-gray-300 mb-4">
            Select Lightbox Style:
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => setVersion("v1")}
              className={`p-4 rounded-lg border-2 transition-all ${
                version === "v1"
                  ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="font-bold mb-2">Version 1</div>
              <div className="text-xs opacity-75">Clean & Minimal</div>
              <div className="text-xs mt-2 opacity-60">
                Simple, uncluttered design
              </div>
            </button>

            <button
              onClick={() => setVersion("v2")}
              className={`p-4 rounded-lg border-2 transition-all ${
                version === "v2"
                  ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="font-bold mb-2">Version 2</div>
              <div className="text-xs opacity-75">Industrial Frame</div>
              <div className="text-xs mt-2 opacity-60">
                Yellow borders, angled corners
              </div>
            </button>

            <button
              onClick={() => setVersion("v3")}
              className={`p-4 rounded-lg border-2 transition-all ${
                version === "v3"
                  ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="font-bold mb-2">Version 3</div>
              <div className="text-xs opacity-75">Dark Tactical (Blue)</div>
              <div className="text-xs mt-2 opacity-60">
                Sleek, military-inspired
              </div>
            </button>

            <button
              onClick={() => setVersion("v4")}
              className={`p-4 rounded-lg border-2 transition-all ${
                version === "v4"
                  ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="font-bold mb-2">Version 4</div>
              <div className="text-xs opacity-75">Dark Tactical (Yellow)</div>
              <div className="text-xs mt-2 opacity-60">
                Same as V3, yellow accent
              </div>
            </button>

            <button
              onClick={() => setVersion("v5")}
              className={`p-4 rounded-lg border-2 transition-all ${
                version === "v5"
                  ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="font-bold mb-2">Version 5</div>
              <div className="text-xs opacity-75">Yellow Gradient</div>
              <div className="text-xs mt-2 opacity-60">
                Black-to-yellow with slider
              </div>
            </button>
          </div>
        </div>

        {/* Description of Current Version */}
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="font-bold text-yellow-400 mb-2">
            {version === "v1" && "Version 1: Clean & Minimal"}
            {version === "v2" && "Version 2: Industrial Frame"}
            {version === "v3" && "Version 3: Dark Tactical (Blue)"}
            {version === "v4" && "Version 4: Dark Tactical (Yellow)"}
            {version === "v5" && "Version 5: Yellow Gradient"}
          </h3>
          <p className="text-sm text-gray-400">
            {version === "v1" &&
              "A simple, uncluttered design with subtle borders and clean typography. Focuses on usability with minimal visual noise."}
            {version === "v2" &&
              "Industrial aesthetic with yellow borders, angled corners, and mechanical feel. Features corner accents and uppercase text styling."}
            {version === "v3" &&
              "Sleek, modern, military-inspired design with blue accent colors. Uses subtle glows and gradients for a tactical command center feel."}
            {version === "v4" &&
              "Same sleek, modern layout as V3 but with yellow accent colors instead of blue. Maintains the tactical command center feel with warmer tones."}
            {version === "v5" &&
              "Black-to-yellow gradient theme with NO blue colors. Features slider-based quantity selection with visual feedback (green selling amount / red remaining amount). Updated fee structure shows listing fee, 2% market fee, and total fees."}
          </p>
        </div>

        {/* Open Button */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-yellow-500/30"
          >
            Open Lightbox
          </button>
        </div>

        {/* Render Selected Version */}
        {version === "v1" && (
          <EssenceListingLightboxV1Clean
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            ownedEssenceVariations={DEMO_OWNED_ESSENCE}
            durationOptions={DURATION_OPTIONS}
          />
        )}
        {version === "v2" && (
          <EssenceListingLightboxV2Industrial
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            ownedEssenceVariations={DEMO_OWNED_ESSENCE}
            durationOptions={DURATION_OPTIONS}
          />
        )}
        {version === "v3" && (
          <EssenceListingLightboxV3Tactical
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            ownedEssenceVariations={DEMO_OWNED_ESSENCE}
            durationOptions={DURATION_OPTIONS}
          />
        )}
        {version === "v4" && (
          <EssenceListingLightboxV4TacticalYellow
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            ownedEssenceVariations={DEMO_OWNED_ESSENCE}
            durationOptions={DURATION_OPTIONS}
          />
        )}
        {version === "v5" && (
          <EssenceListingLightboxV5YellowGradient
            show={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            ownedEssenceVariations={DEMO_OWNED_ESSENCE}
            durationOptions={DURATION_OPTIONS}
          />
        )}

        {/* Feature Comparison */}
        <div className="mt-12 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-bold text-gray-300 mb-4">
            Key Features (All Versions)
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                <strong>Combination Lock-Style Digit Controls:</strong> Each digit
                position (10k, 1k, 100, 10, 1) has individual up/down arrows
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                <strong>Owned Essence Filter:</strong> Only shows variations you
                own with current amounts
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                <strong>Duration Selection:</strong> 5 duration options (1, 3, 7,
                14, 30 days) with escalating costs
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span>
                <strong>Transaction Summary:</strong> Shows total value, quantity,
                and listing fee
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
