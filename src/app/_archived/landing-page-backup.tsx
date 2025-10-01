"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import { BrowserWallet } from '@meshsdk/core'; // Disabled - causing runtime errors
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import UsernameModal from "@/components/UsernameModal";

interface WalletInfo {
  name: string;
  icon: string;
  version: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const createOrUpdateUser = useMutation(api.users.createOrUpdate);
  const [goldCounter, setGoldCounter] = useState(1547823);
  const [essenceCounter, setEssenceCounter] = useState(89234);
  const [marketListings, setMarketListings] = useState(342);
  const [particles, setParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, x: number, y: number, size: number, opacity: number, twinkle: boolean}>>([]);
  const [backgroundStars, setBackgroundStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempWalletAddress, setTempWalletAddress] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // DEMO MODE: Skip wallet connection and go straight to hub
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setIsDemoMode(true);
      router.push('/hub?demo=true');
    }
  }, [router]);

  // Generate particles on client side only
  useEffect(() => {
    const generatedParticles = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 2}s`,
    }));
    setParticles(generatedParticles);

    // Check for available wallets - DISABLED (MeshSDK causing runtime errors)
    // const wallets = BrowserWallet.getInstalledWallets();
    // setAvailableWallets(wallets);
    setAvailableWallets([]); // No wallets available while disabled

    // Generate static night sky stars around logo
    const generatedStars = [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * 800 - 400, // -400 to 400 px from center
      y: Math.random() * 300 - 150, // -150 to 150 px from center
      size: Math.random() * 2 + 0.5, // 0.5 to 2.5 px
      opacity: Math.random() * 0.8 + 0.2, // 0.2 to 1 opacity
      twinkle: Math.random() > 0.7, // 30% chance to twinkle
    }));
    setStars(generatedStars);

    // Generate background stars across entire page - doubled with more twinkling
    const generatedBackgroundStars = [...Array(200)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5, // 0.5 to 2.5 px
      opacity: Math.random() * 0.8 + 0.4, // 0.4 to 1.0 opacity (brighter)
      twinkle: Math.random() > 0.5, // 50% chance to twinkle (more stars twinkling)
    }));
    setBackgroundStars(generatedBackgroundStars);
  }, []);

  // Simulate live counters
  useEffect(() => {
    const goldInterval = setInterval(() => {
      setGoldCounter(prev => prev + Math.floor(Math.random() * 10) + 5);
    }, 500);

    const essenceInterval = setInterval(() => {
      setEssenceCounter(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 800);

    const marketInterval = setInterval(() => {
      setMarketListings(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(300, prev + change);
      });
    }, 3000);

    return () => {
      clearInterval(goldInterval);
      clearInterval(essenceInterval);
      clearInterval(marketInterval);
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    setWalletError(null);
    
    try {
      if (availableWallets.length === 0) {
        setWalletError("No Cardano wallet detected. Please install Nami, Eternl, or Flint.");
        setIsConnecting(false);
        return;
      }

      // Try to connect to the first available wallet - DISABLED (MeshSDK causing runtime errors)
      // const wallet = await BrowserWallet.enable(availableWallets[0].name);
      const wallet = null; // Wallet connection disabled
      
      if (wallet) {
        // Get both payment and stake addresses
        const addresses = await wallet.getUsedAddresses();
        const walletAddress = addresses[0]; // Payment address
        
        // Get reward (stake) addresses - this is what NFTs are associated with
        const rewardAddresses = await wallet.getRewardAddresses();
        const stakeAddress = rewardAddresses[0]; // Stake address
        
        // Store wallet info in localStorage for persistence
        localStorage.setItem('connectedWallet', availableWallets[0].name);
        localStorage.setItem('walletAddress', walletAddress);
        localStorage.setItem('stakeAddress', stakeAddress);
        
        // Save to Convex database
        await createOrUpdateUser({
          walletAddress: stakeAddress || walletAddress, // Use stake address for NFT lookups
          walletName: availableWallets[0].name,
          lastConnected: new Date().toISOString(),
        });
        
        
        // Redirect to essence page
        window.location.href = '/hub';
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError("Failed to connect wallet. Please try again.");
      setIsConnecting(false);
    }
  };

  // Show redirect message if in demo mode
  if (isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-yellow-400 text-3xl font-bold mb-4 animate-pulse">
            🎭 DEMO MODE
          </div>
          <div className="text-white text-xl">
            Redirecting to hub...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Night sky stars across entire page */}
      <div className="absolute inset-0">
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? 'starTwinkle 2s ease-in-out infinite' : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
      </div>

      {/* Animated background pattern similar to hub */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
      </div>

      {/* Gold particle effects */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Logo without gleam */}
        <div className="mb-8">
          <Image
            src="/logo-big.png"
            alt="Mek Tycoon"
            width={600}
            height={150}
            className="object-contain h-[150px] w-auto drop-shadow-[0_0_10px_rgba(250,182,23,0.5)]"
            priority
          />
        </div>

        {/* Tagline */}
        <p className="text-yellow-400/80 text-lg mb-12 font-medium tracking-wider uppercase">
          The Ultimate Mek Crafting Experience
        </p>

        {/* Connect Wallet Button */}
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`
            relative px-12 py-5 
            bg-black/50 
            border-2 border-yellow-400 
            text-yellow-400 
            font-bold text-xl 
            uppercase tracking-wider 
            rounded-xl 
            transition-all duration-300
            hover:scale-110 
            hover:shadow-[0_0_30px_rgba(250,182,23,0.6)]
            hover:border-yellow-300
            hover:text-yellow-300
            group
            overflow-hidden
            ${isConnecting ? 'animate-pulse' : ''}
          `}
          style={{
            background: isConnecting ? `
              linear-gradient(135deg, rgba(250, 182, 23, 0.2) 0%, rgba(250, 182, 23, 0.1) 50%, rgba(250, 182, 23, 0.2) 100%)
            ` : `
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
          <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <span className="relative z-10 drop-shadow-[0_0_4px_rgba(255,204,0,0.4)] flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
        </button>

        {/* Error message */}
        {walletError && (
          <div className="mt-4 px-6 py-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {walletError}
          </div>
        )}

        {/* Wallet options if available */}
        {availableWallets.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            Detected: {availableWallets.map(w => w.name).join(', ')}
          </div>
        )}

        {/* Skip for now link */}
        <button
          onClick={async () => {
            // Generate a demo wallet address for testing
            const demoWalletAddress = `demo_wallet_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            
            // Store in localStorage
            localStorage.setItem('connectedWallet', 'demo');
            localStorage.setItem('walletAddress', demoWalletAddress);
            localStorage.setItem('stakeAddress', demoWalletAddress);
            
            // Create user in database
            try {
              await createOrUpdateUser({
                walletAddress: demoWalletAddress,
                walletName: 'Demo Wallet',
                lastConnected: new Date().toISOString(),
              });
              
              // Show username modal
              setTempWalletAddress(demoWalletAddress);
              setShowUsernameModal(true);
            } catch (error) {
              console.error('Failed to create demo user:', error);
              // Continue anyway
              window.location.href = '/hub';
            }
          }}
          className="mt-8 text-gray-500 hover:text-gray-400 text-sm transition-colors"
        >
          Continue without wallet →
        </button>
      </div>

      {/* Bottom stats bar with live counters */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 border-t border-yellow-400/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-400">4000</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Total Meks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">291</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Unique Variations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {goldCounter.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Gold Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {essenceCounter.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Essence Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{marketListings}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Market Listings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Username Modal */}
      {showUsernameModal && tempWalletAddress && (
        <UsernameModal
          isOpen={showUsernameModal}
          walletAddress={tempWalletAddress}
          onClose={() => {
            setShowUsernameModal(false);
            window.location.href = '/hub';
          }}
          onSuccess={(displayName) => {
            console.log('Display name set:', displayName);
            window.location.href = '/hub';
          }}
        />
      )}

    </div>
  );
}
