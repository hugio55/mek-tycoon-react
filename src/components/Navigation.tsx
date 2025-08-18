"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface NavCategory {
  id: string;
  title: string;
  icon: string;
  items: {
    label: string;
    href: string;
  }[];
}

const navCategories: NavCategory[] = [
  {
    id: "operations",
    title: "Operations",
    icon: "🏭",
    items: [
      { label: "Essence", href: "/essence" },
      { label: "Essence Empire", href: "/essence-empire" },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: "⚙️",
    items: [
      { label: "Crafting", href: "/crafting" },
      { label: "Auction", href: "/auction" },
      { label: "Bank", href: "/bank" },
      { label: "Inventory", href: "/inventory" },
    ],
  },
  {
    id: "meks",
    title: "Meks",
    icon: "🌟",
    items: [
      { label: "Talents", href: "/talents" },
      { label: "Achievements", href: "/achievements" },
      { label: "XP Allocation", href: "/xp-allocation" },
    ],
  },
  {
    id: "management",
    title: "Management",
    icon: "🤖",
    items: [
      { label: "Profile", href: "/profile" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    id: "scrapyard",
    title: "Scrap Yard",
    icon: "🎮",
    items: [
      { label: "Fighting Arena", href: "/arena" },
      { label: "Minigames", href: "/minigames" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: "⚡",
    items: [
      { label: "Balance", href: "/balance" },
      { label: "Focus System", href: "/focus" },
    ],
  },
];

export default function Navigation() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div>
      {/* Large Logo at Top Center */}
      <div className="flex justify-center py-5 mb-5">
        <Link href="/hub" className="group">
          <div className="relative inline-block overflow-hidden" style={{ maxHeight: '100px' }}>
            {/* Logo shimmer/gleam effect */}
            <div 
              className="absolute inset-0 -left-full z-10 pointer-events-none"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.4) 30%,
                  rgba(255, 255, 255, 0.8) 50%,
                  rgba(255, 255, 255, 0.4) 70%,
                  transparent
                )`,
                mixBlendMode: 'overlay',
                animation: 'logoShimmer 4s ease-in-out infinite',
              }}
            />
            
            <Image
              src="/logo-big.png"
              alt="Mek Tycoon Logo"
              width={400}
              height={100}
              className="object-contain h-[100px] w-auto drop-shadow-[0_0_5px_rgba(250,182,23,0.5)] group-hover:drop-shadow-[0_0_7.5px_rgba(250,182,23,0.8)] transition-all group-hover:scale-105"
              priority
            />
            
            {/* CSS for shimmer animation */}
            <style jsx>{`
              @keyframes logoShimmer {
                0% {
                  left: -100%;
                  opacity: 0;
                }
                20% {
                  opacity: 1;
                }
                50% {
                  left: 100%;
                  opacity: 1;
                }
                100% {
                  left: 100%;
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        </Link>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-transparent p-2 mb-4 relative z-50">
        <div className="flex items-stretch gap-4">
          {/* HUB Button */}
          <div className="flex-shrink-0 h-[70px] flex items-stretch">
            <Link
              href="/hub"
              className="relative h-full w-[75px] flex items-center justify-center bg-black/20 border-2 border-yellow-400 text-yellow-400 rounded-xl font-bold uppercase tracking-wider text-xl hover:scale-110 transition-transform hover:shadow-[0_0_20px_rgba(250,182,23,0.6)] group overflow-hidden"
              style={{
                background: `
                  repeating-linear-gradient(
                    45deg,
                    rgba(0, 0, 0, 0.3),
                    rgba(0, 0, 0, 0.3) 8px,
                    rgba(255, 204, 0, 0.08) 8px,
                    rgba(255, 204, 0, 0.08) 16px
                  ),
                  linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.3) 100%)
                `,
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,204,0,0.4)]">HUB</span>
            </Link>
          </div>

          {/* Navigation Categories Grid */}
          <div className="grid grid-cols-3 grid-rows-2 gap-1.5 flex-1 h-[70px] max-w-[calc(100%-90px)]">
          {navCategories.map((category) => (
            <div
              key={category.id}
              className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400/50 rounded-xl overflow-visible transition-all ${
                expandedCategory === category.id
                  ? "border-yellow-400 shadow-[0_8px_35px_rgba(255,204,0,0.4)] -translate-y-0.5 z-[200]"
                  : "hover:border-yellow-400/70"
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full h-full px-2 py-1 flex items-center justify-between hover:bg-yellow-400/5 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-yellow-400 text-[0.65rem] font-semibold uppercase tracking-wider">
                    {category.title}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-xs transition-transform ${
                    expandedCategory === category.id ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </div>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute top-full left-0 right-0 mt-0.5 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400 border-t-0 rounded-b-xl shadow-[0_8px_25px_rgba(255,204,0,0.3)] transition-all z-[300] ${
                  expandedCategory === category.id
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2"
                }`}
              >
                <div className="p-2 grid grid-cols-1 gap-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-600 text-white text-[0.65rem] font-medium uppercase tracking-wider rounded hover:from-gray-700 hover:to-gray-800 hover:border-gray-500 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all text-center overflow-hidden group"
                      onClick={() => setExpandedCategory(null)}
                    >
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
    </div>
  );
}