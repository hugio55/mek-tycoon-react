"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSound } from "@/contexts/SoundContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface NavCategory {
  id: string;
  title: string;
  icon: string;
  items: {
    label: string;
    href: string;
    onClick?: () => void;
  }[];
}

const navCategories: readonly NavCategory[] = [
  {
    id: "operations",
    title: "Operations",
    icon: "🏭",
    items: [
      { label: "Essence", href: "/essence" },
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
      { label: "User Management", href: "/admin/users" },
      { label: "Master Data Systems", href: "/admin-master-data" },
      { label: "Mek Gold Mining", href: "/mek-gold-mining" },
      { label: "Save System", href: "/admin-save" },
      { label: "Mek Selector", href: "/mek-selector" },
      { label: "Shop Manager", href: "/admin-shop" },
      { label: "UI Showcase", href: "/ui-showcase" },
      { label: "Rarity Bias", href: "/rarity-bias" },
      { label: "Talent Builder", href: "/talent-builder" },
      { label: "Mek Tree Tables", href: "/admin-mek-tree-tables" },
      { label: "Buff Categories", href: "/admin/buff-categories" },
      { label: "Frames", href: "/admin/frames" },
      { label: "Spell Designer", href: "/admin-spells" },
      { label: "Spell Caster 3D", href: "/spell-caster-3d" },
      { label: "Plinko", href: "/admin-plinko" },
      { label: "Story Rewards", href: "/story-rewards" },
      { label: "Event Node Rewards", href: "/event-node-rewards" },
      { label: "Sphere Selector", href: "/admin-sphere" },
      { label: "Uni-Chips", href: "/uni-chips" },
      { label: "Essence Donut", href: "/essence-donut" },
      { label: "Dev Toolbar", href: "/dev-toolbar.html", onClick: () => window.open("/dev-toolbar.html", "devToolbar") },
    ],
  },
];

interface NavigationProps {
  fullWidth?: boolean;
}

export default function Navigation({ fullWidth = false }: NavigationProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [menuHeaderStyle, setMenuHeaderStyle] = useState('standard-balanced');
  const { soundEnabled, toggleSound, playClickSound } = useSound();

  // Get wallet address from localStorage
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check for wallet address changes
    const checkWalletAddress = () => {
      const stored = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress');
      setWalletAddress(stored);
    };

    // Initial check
    checkWalletAddress();

    // Listen for storage changes (when wallet connects/disconnects)
    window.addEventListener('storage', checkWalletAddress);

    // Also check periodically for changes (backup)
    const interval = setInterval(checkWalletAddress, 1000);

    return () => {
      window.removeEventListener('storage', checkWalletAddress);
      clearInterval(interval);
    };
  }, []);

  // Get user stats (with real-time updates)
  const userStats = useQuery(
    api.userStats.getUserStats,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get company name for current wallet
  const companyNameData = useQuery(
    api.goldMining.getCompanyName,
    walletAddress ? { walletAddress } : "skip"
  );

  // State for real-time cumulative gold
  const [realtimeCumulativeGold, setRealtimeCumulativeGold] = useState(0);

  // Track the base values separately to avoid resetting the animation
  const [baseGold, setBaseGold] = useState(0);
  const [goldPerHour, setGoldPerHour] = useState(0);

  // Update base values only when they actually change from the database
  useEffect(() => {
    if (!userStats) return;

    // Update base gold if it changed significantly (more than what we'd accumulate in 1 second)
    const tolerance = (goldPerHour / 3600) * 2; // 2 seconds worth of accumulation
    if (Math.abs((userStats.totalCumulativeGold || 0) - baseGold) > tolerance) {
      setBaseGold(userStats.totalCumulativeGold || 0);
    }

    // Update rate if it changed
    if (userStats.goldPerHour !== goldPerHour) {
      setGoldPerHour(userStats.goldPerHour);
    }
  }, [userStats, baseGold, goldPerHour]);

  // Real-time gold accumulation (runs independently of database updates)
  useEffect(() => {
    setRealtimeCumulativeGold(baseGold);

    if (goldPerHour <= 0) return;

    const startTime = Date.now();
    const startValue = baseGold;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds elapsed
      const goldEarned = (goldPerHour / 3600) * elapsed; // gold earned since start
      setRealtimeCumulativeGold(startValue + goldEarned);
    }, 100); // Update every 100ms for smooth counting

    return () => clearInterval(interval);
  }, [baseGold, goldPerHour]); // Only reset when base values change

  const toggleCategory = (categoryId: string) => {
    playClickSound();
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  useEffect(() => {
    setMounted(true);
    const savedHeaderStyle = localStorage.getItem('menuHeaderStyle');
    if (savedHeaderStyle) {
      setMenuHeaderStyle(savedHeaderStyle);
    }

    const handleHeaderStyleChange = (event: CustomEvent) => {
      setMenuHeaderStyle(event.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuHeaderStyle' && e.newValue) {
        setMenuHeaderStyle(e.newValue);
      }
    };

    window.addEventListener('menuHeaderStyleChanged', handleHeaderStyleChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('menuHeaderStyleChanged', handleHeaderStyleChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  const getHeaderStyles = () => {
    const styles = {
      'ultra-minimal': {
        layout: 'horizontal',
        logoWidth: 200,
        logoHeight: 50,
        navHeight: 'h-[40px]',
        hubWidth: 'w-[50px]',
        fontSize: 'text-[0.5rem]',
        iconSize: 'text-[0.65rem]',
        spacing: 'gap-1',
        navMaxWidth: 'max-w-[500px]',
        padding: 'px-2 py-1'
      },
      'compact-professional': {
        layout: 'horizontal',
        logoWidth: 250,
        logoHeight: 60,
        navHeight: 'h-[45px]',
        hubWidth: 'w-[55px]',
        fontSize: 'text-[0.55rem]',
        iconSize: 'text-[0.7rem]',
        spacing: 'gap-1.5',
        navMaxWidth: 'max-w-[550px]',
        padding: 'px-3 py-2'
      },
      'standard-balanced': {
        layout: 'horizontal',
        logoWidth: 280,
        logoHeight: 70,
        navHeight: 'h-[55px]',
        hubWidth: 'w-[65px]',
        fontSize: 'text-[0.6rem]',
        iconSize: 'text-xs',
        spacing: 'gap-2',
        navMaxWidth: 'max-w-[600px]',
        padding: 'px-4 py-2'
      },
      'bold-statement': {
        layout: 'centered',
        logoWidth: 400,
        logoHeight: 100,
        navHeight: 'h-[60px]',
        hubWidth: 'w-[80px]',
        fontSize: 'text-[0.65rem]',
        iconSize: 'text-sm',
        spacing: 'gap-3',
        navMaxWidth: 'max-w-[700px]',
        padding: 'px-4 py-3'
      },
      'cinematic-wide': {
        layout: 'centered',
        logoWidth: 500,
        logoHeight: 120,
        navHeight: 'h-[70px]',
        hubWidth: 'w-[90px]',
        fontSize: 'text-[0.7rem]',
        iconSize: 'text-base',
        spacing: 'gap-4',
        navMaxWidth: 'max-w-[800px]',
        padding: 'px-5 py-4'
      },
      'dynamic-responsive': {
        layout: 'horizontal',
        logoWidth: 300,
        logoHeight: 75,
        navHeight: 'h-[50px] sm:h-[55px] md:h-[60px]',
        hubWidth: 'w-[60px] sm:w-[65px] md:w-[70px]',
        fontSize: 'text-[0.5rem] sm:text-[0.55rem] md:text-[0.6rem]',
        iconSize: 'text-[0.65rem] sm:text-[0.7rem] md:text-xs',
        spacing: 'gap-1 sm:gap-1.5 md:gap-2',
        navMaxWidth: 'max-w-[500px] sm:max-w-[550px] md:max-w-[600px]',
        padding: 'px-2 py-1 sm:px-3 sm:py-2'
      },
      'logo-left-corner': {
        layout: 'corner',
        logoWidth: 250,
        logoHeight: 65,
        navHeight: 'h-[50px]',
        hubWidth: 'w-[60px]',
        fontSize: 'text-[0.58rem]',
        iconSize: 'text-[0.75rem]',
        spacing: 'gap-2',
        navMaxWidth: 'max-w-[580px]',
        padding: 'px-3 py-2'
      },
      'logo-left-small': {
        layout: 'horizontal',
        logoWidth: 200,
        logoHeight: 50,
        navHeight: 'h-[45px]',
        hubWidth: 'w-[55px]',
        fontSize: 'text-[0.55rem]',
        iconSize: 'text-[0.7rem]',
        spacing: 'gap-1.5',
        navMaxWidth: 'max-w-[520px]',
        padding: 'px-2 py-1'
      },
      'logo-left-medium': {
        layout: 'horizontal',
        logoWidth: 280,
        logoHeight: 70,
        navHeight: 'h-[55px]',
        hubWidth: 'w-[65px]',
        fontSize: 'text-[0.6rem]',
        iconSize: 'text-xs',
        spacing: 'gap-2',
        navMaxWidth: 'max-w-[600px]',
        padding: 'px-3 py-2'
      },
      'logo-left-large': {
        layout: 'horizontal',
        logoWidth: 320,
        logoHeight: 80,
        navHeight: 'h-[60px]',
        hubWidth: 'w-[70px]',
        fontSize: 'text-[0.65rem]',
        iconSize: 'text-sm',
        spacing: 'gap-2.5',
        navMaxWidth: 'max-w-[650px]',
        padding: 'px-4 py-2'
      }
    };

    return styles[menuHeaderStyle as keyof typeof styles] || styles['standard-balanced'];
  };

  const currentStyles = getHeaderStyles();

  const renderUserStats = () => {
    if (!userStats || (!userStats.mekCount && !realtimeCumulativeGold)) {
      return null;
    }

    return (
      <div ref={walletDropdownRef} className="fixed top-4 left-4 z-[65]">
        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-2 border-yellow-400/50 rounded-lg p-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="space-y-2">
            {/* Company Name Header */}
            <div className="border-b border-yellow-400/20 pb-2 mb-2">
              <span className="text-yellow-400 font-bold text-lg uppercase tracking-widest">
                {companyNameData?.hasCompanyName ? companyNameData.companyName : 'Corporation'}
              </span>
            </div>

            {/* Wallet Address Display */}
            <div className="px-3 py-2 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-yellow-400/30 rounded">
              <div className="text-gray-400 text-[0.6rem] uppercase tracking-wider mb-1">Wallet Address</div>
              <div className="text-gray-300 font-mono text-[0.65rem] truncate">
                {walletAddress}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-yellow-400/70 text-sm uppercase tracking-wider">Meks:</span>
              <span className="text-yellow-400 font-bold text-base">{userStats.mekCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400/70 text-sm uppercase tracking-wider whitespace-nowrap">Total Cumulative Gold:</span>
              <span className="text-yellow-400 font-bold text-base">{Math.floor(realtimeCumulativeGold).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNavigation = () => (
    <>
      <div className={`flex items-stretch ${currentStyles.spacing} ${currentStyles.navMaxWidth}`}>
        <div className={`flex-shrink-0 ${currentStyles.navHeight} flex items-stretch`}>
          <Link
            href="/hub"
            onClick={playClickSound}
            className={`relative h-full ${currentStyles.hubWidth} flex items-center justify-center bg-black/20 border-2 border-yellow-400 text-yellow-400 rounded-xl font-bold uppercase tracking-wider hover:scale-105 transition-transform hover:shadow-[0_0_20px_rgba(250,182,23,0.6)] group overflow-hidden`}
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
            <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <span className={`relative z-10 drop-shadow-[0_0_4px_rgba(255,204,0,0.4)] ${currentStyles.fontSize}`}>HUB</span>
          </Link>
        </div>

        <div className={`grid grid-cols-3 grid-rows-2 ${currentStyles.spacing} flex-1 ${currentStyles.navHeight} ${currentStyles.navMaxWidth}`}>
          {navCategories.map((category) => (
            <div
              key={category.id}
              className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400/50 rounded-lg overflow-visible transition-all ${
                expandedCategory === category.id
                  ? "border-yellow-400 shadow-[0_8px_35px_rgba(255,204,0,0.4)] -translate-y-0.5 z-50"
                  : "hover:border-yellow-400/70"
              }`}
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full h-full px-2 py-1 flex items-center justify-between hover:bg-yellow-400/5 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className={currentStyles.iconSize}>{category.icon}</span>
                  <span className={`text-yellow-400 ${currentStyles.fontSize} font-semibold uppercase tracking-wider`}>
                    {category.title}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-[0.5rem] transition-transform ${
                    expandedCategory === category.id ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </div>
              </button>

              {mounted && (
                <div
                  className={`absolute top-full left-0 right-0 mt-0.5 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400 border-t-0 rounded-b-lg shadow-[0_8px_25px_rgba(255,204,0,0.3)] transition-all z-50 ${
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
                        className={`relative px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-600 text-white ${currentStyles.fontSize} font-medium uppercase tracking-wider rounded hover:from-gray-700 hover:to-gray-800 hover:border-gray-500 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)] transition-all text-center overflow-hidden group`}
                        onClick={(e) => {
                          playClickSound();
                          setExpandedCategory(null);
                          if (item.onClick) {
                            e.preventDefault();
                            item.onClick();
                          }
                        }}
                      >
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
    </>
  );

  const renderControls = () => (
    <div className="absolute top-2 right-2 z-50 flex items-center gap-4">
      <button
        onClick={() => {
          playClickSound();
          localStorage.removeItem('connectedWallet');
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('stakeAddress');
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
  );


  if (currentStyles.layout === 'centered') {
    return (
      <div className="w-full">
        <div className={`flex justify-center ${currentStyles.padding} mb-2`}>
          <Link href="/hub" className="group block">
            <Image
              src="/logo-big.png"
              alt="Mek Tycoon Logo"
              width={currentStyles.logoWidth}
              height={currentStyles.logoHeight}
              className="object-contain drop-shadow-[0_0_5px_rgba(250,182,23,0.5)] group-hover:drop-shadow-[0_0_7.5px_rgba(250,182,23,0.8)] transition-all"
              style={{ height: `${currentStyles.logoHeight}px` }}
              priority
            />
          </Link>
        </div>

        <nav className={`flex justify-center ${currentStyles.padding}`} ref={navRef}>
          {renderNavigation()}
        </nav>
        {renderControls()}
        {renderUserStats()}
      </div>
    );
  }

  if (currentStyles.layout === 'corner') {
    return (
      <div className="w-full">
        <div className="fixed top-2 left-2 z-[70]">
          <Link href="/hub" className="group block">
            <Image
              src="/logo-big.png"
              alt="Mek Tycoon Logo"
              width={currentStyles.logoWidth}
              height={currentStyles.logoHeight}
              className="object-contain drop-shadow-[0_0_5px_rgba(250,182,23,0.5)] group-hover:drop-shadow-[0_0_7.5px_rgba(250,182,23,0.8)] transition-all"
              style={{ height: `${currentStyles.logoHeight}px` }}
              priority
            />
          </Link>
        </div>

        <nav className={`${currentStyles.padding}`} style={{ marginLeft: `${currentStyles.logoWidth + 20}px` }} ref={navRef}>
          {renderNavigation()}
        </nav>
        {renderControls()}
        {renderUserStats()}
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className="w-full">
      <div className={`flex items-center ${currentStyles.spacing} ${currentStyles.padding} mb-4`}>
        <div className="flex-shrink-0">
          <Link href="/hub" className="group block">
            <Image
              src="/logo-big.png"
              alt="Mek Tycoon Logo"
              width={currentStyles.logoWidth}
              height={currentStyles.logoHeight}
              className="object-contain drop-shadow-[0_0_5px_rgba(250,182,23,0.5)] group-hover:drop-shadow-[0_0_7.5px_rgba(250,182,23,0.8)] transition-all"
              style={{ height: `${currentStyles.logoHeight}px` }}
              priority
            />
          </Link>
        </div>

        <nav className="flex-1" ref={navRef}>
          {renderNavigation()}
        </nav>
      </div>
      {renderControls()}
      {renderUserStats()}
    </div>
  );
}