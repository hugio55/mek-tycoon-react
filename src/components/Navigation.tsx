"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSound } from "@/contexts/SoundContext";

interface NavCategory {
  id: string;
  title: string;
  icon: string;
  items: {
    label: string;
    href: string;
  }[];
}

const navCategories: readonly NavCategory[] = [
  {
    id: "operations",
    title: "Operations",
    icon: "🏭",
    items: [
      { label: "Essence", href: "/essence" },
      // { label: "Essence Empire", href: "/essence-empire" },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: "⚙️",
    items: [
      { label: "Crafting", href: "/crafting" },
      { label: "Incinerator", href: "/incinerator" },
      { label: "Shop", href: "/shop" },
      { label: "Bank", href: "/bank" },
      { label: "Inventory", href: "/inventory" },
    ],
  },
  {
    id: "meks",
    title: "Meks",
    icon: "🌟",
    items: [
      { label: "CiruTree", href: "/cirutree" },
      { label: "Achievements", href: "/achievements" },
      { label: "XP Allocation", href: "/xp-allocation" },
      { label: "Spell Caster", href: "/spell-caster" },
    ],
  },
  {
    id: "management",
    title: "Management",
    icon: "🤖",
    items: [
      { label: "Profile", href: "/profile" },
      { label: "Search", href: "/search" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    id: "scrapyard",
    title: "Scrap Yard",
    icon: "🎮",
    items: [
      { label: "Contracts", href: "/contracts" },
      { label: "Single Missions", href: "/contracts/single-missions" },
      { label: "Story Mode", href: "/contracts/chapters" },
      { label: "Story Climb", href: "/scrap-yard/story-climb" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: "⚡",
    items: [
      { label: "Admin Dashboard", href: "/admin" },
      { label: "Save System", href: "/admin-save" },
      // { label: "Mek Assignment", href: "/mek-assignment" },
      { label: "Mek Selector", href: "/mek-selector" },
      // { label: "Mek Swarm", href: "/mek-swarm" },
      { label: "Shop Manager", href: "/admin-shop" },
      { label: "UI Showcase", href: "/ui-showcase" },
      // { label: "Balance", href: "/balance" },
      { label: "Rarity Bias", href: "/rarity-bias" },
      { label: "Talent Builder", href: "/talent-builder" },
      { label: "Mek Tree Tables", href: "/admin-mek-tree-tables" },
      { label: "Spell Designer", href: "/admin-spells" },
      { label: "Spell Caster 3D", href: "/spell-caster-3d" },
      { label: "Plinko", href: "/admin-plinko" },
      { label: "Story Rewards", href: "/story-rewards" },
      { label: "Event Node Rewards", href: "/event-node-rewards" },
      { label: "Sphere Selector", href: "/admin-sphere" },
    ],
  },
];

export default function Navigation() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, toggleSound, playClickSound } = useSound();

  const toggleCategory = (categoryId: string) => {
    playClickSound();
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setExpandedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Large Logo at Top Center */}
      <div className="flex justify-center py-5 mb-5 relative z-[60]">
        <Link href="/hub" className="group">
          <Image
            src="/logo-big.png"
            alt="Mek Tycoon Logo"
            width={400}
            height={100}
            className="object-contain drop-shadow-[0_0_5px_rgba(250,182,23,0.5)] group-hover:drop-shadow-[0_0_7.5px_rgba(250,182,23,0.8)] transition-all"
            style={{ height: '100px', width: 'auto' }}
            priority
          />
        </Link>
      </div>


      {/* Welcome/Logout Link */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-4">
        <button
          onClick={() => {
            playClickSound();
            // Clear wallet data from localStorage
            localStorage.removeItem('connectedWallet');
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('stakeAddress');
            // Redirect to welcome page
            window.location.href = '/';
          }}
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Disconnect Wallet
        </button>
        <button
          onClick={() => {
            playClickSound();
            toggleSound();
          }}
          className="text-gray-400 hover:text-yellow-400 text-sm transition-colors p-1"
          title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
        >
          {soundEnabled ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </button>
        <Link
          href="/"
          className="text-gray-500 hover:text-yellow-400 text-sm transition-colors"
          onClick={playClickSound}
        >
          ← Welcome
        </Link>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-transparent p-2 mb-4 relative z-50" ref={navRef}>
        <div className="flex items-stretch gap-4">
          {/* HUB Button */}
          <div className="flex-shrink-0 h-[70px] flex items-stretch">
            <Link
              href="/hub"
              onClick={playClickSound}
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
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
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
                  ? "border-yellow-400 shadow-[0_8px_35px_rgba(255,204,0,0.4)] -translate-y-0.5 z-50"
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
              {mounted && (
              <div
                className={`absolute top-full left-0 right-0 mt-0.5 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400 border-t-0 rounded-b-xl shadow-[0_8px_25px_rgba(255,204,0,0.3)] transition-all z-50 ${
                  expandedCategory === category.id
                    ? "opacity-100 visible translate-y-0 pointer-events-auto"
                    : "opacity-0 invisible -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="p-2 grid grid-cols-1 gap-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-600 text-white text-[0.65rem] font-medium uppercase tracking-wider rounded hover:from-gray-700 hover:to-gray-800 hover:border-gray-500 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all text-center overflow-hidden group"
                      onClick={() => {
                        playClickSound();
                        setExpandedCategory(null);
                      }}
                    >
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
    </div>
  );
}