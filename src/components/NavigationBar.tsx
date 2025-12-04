"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { restoreWalletSession } from "@/lib/walletSessionManager";
import { useState, useEffect, useRef, useContext } from "react";
import { LoaderContext, TIMING } from "@/features/page-loader";

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  // ============================================================
  // 🚨 ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS 🚨
  // React Rules of Hooks: Hooks must be called unconditionally
  // ============================================================
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentGold, setCurrentGold] = useState(0);
  const goldAnimationRef = useRef<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imageKeyRef = useRef<string | null>(null);

  // Check if we're in a loading state (use useContext directly to avoid hook-in-try-catch)
  const loaderContext = useContext(LoaderContext);
  const isPageLoading = loaderContext?.isLoading ?? false;

  // ============================================================
  // 🚨 NAVIGATION BAR VISIBILITY CONTROL 🚨
  // ============================================================
  // Currently HIDDEN on:
  // - Root page (/) for public launch
  // - Landing page (/landing) which has its own custom UI
  // - Landing V2 page (/landing-v2) which has its own custom UI
  // - Maintenance page (/wen) which should be completely blank
  // - Talent builder (/talent-builder) which has its own Toolbar
  //
  // TO RE-ENABLE NAVIGATION ON ROOT PAGE:
  // Simply comment out or delete the if statement below
  // ============================================================

  // More robust pathname checking (handles trailing slashes)
  const normalizedPath = pathname?.toLowerCase().replace(/\/$/, '') || '';
  const shouldHide = normalizedPath === '' || normalizedPath === '/landing' || normalizedPath === '/landing-v2' || normalizedPath === '/wen' || normalizedPath === '/talent-builder';

  // Get wallet address from session
  useEffect(() => {
    const loadWallet = async () => {
      const session = await restoreWalletSession();
      const address = session?.stakeAddress || null;
      console.log('[🎯NAV] Wallet session loaded:', {
        hasSession: !!session,
        stakeAddress: address ? address.slice(0, 20) + '...' : null,
        fullAddress: address
      });
      setWalletAddress(address);
    };
    loadWallet();
  }, []);

  // Get active navigation configuration
  const activeNavConfig = useQuery(api.navigation.getActiveNavigationConfig);

  // Get gold mining data for display zones
  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  // Debug log gold mining data
  useEffect(() => {
    console.log('[🎯NAV] Gold mining data updated:', {
      hasData: !!goldMiningData,
      currentGold: goldMiningData?.currentGold || 0,
      totalGoldPerHour: goldMiningData?.totalGoldPerHour || 0,
      mekCount: goldMiningData?.ownedMeks?.length || 0,
      walletAddress: walletAddress ? walletAddress.slice(0, 20) + '...' : null
    });
  }, [goldMiningData, walletAddress]);

  // Get essence data for display zones
  const essenceData = useQuery(
    api.essence.getPlayerEssenceState,
    walletAddress ? { walletAddress } : "skip"
  );

  // Get the overlay data if navigation is active
  const overlayData = useQuery(
    api.overlays.getOverlay,
    activeNavConfig ? { imageKey: activeNavConfig.overlayImageKey } : "skip"
  );

  // Handle image load - show immediately
  const handleImageLoad = () => {
    console.log('[🎯NAV-DEBUG] handleImageLoad fired - setting imageLoaded to TRUE');
    setImageLoaded(true);
    setIsVisible(true);
  };

  // Reset loading state ONLY when navigation changes (not on initial load)
  useEffect(() => {
    const currentImageKey = activeNavConfig?.overlayImageKey;
    const previousImageKey = imageKeyRef.current;

    console.log('[🔄RESET-EFFECT] Reset effect triggered', {
      currentImageKey,
      previousImageKey,
      isInitialLoad: previousImageKey === null,
      imageKeysMatch: previousImageKey === currentImageKey,
      willReset: previousImageKey !== null && previousImageKey !== currentImageKey,
      imageLoadedState: imageLoaded
    });

    // Only reset if we're switching to a DIFFERENT navigation (not initial load)
    if (previousImageKey !== null && previousImageKey !== currentImageKey) {
      console.log('[🔄RESET-EFFECT] Navigation changed - resetting imageLoaded to FALSE');
      setImageLoaded(false);
      setIsVisible(false);
    } else if (previousImageKey === null) {
      console.log('[🔄RESET-EFFECT] Initial load - NOT resetting imageLoaded (let onLoad handler set it)');
    } else {
      console.log('[🔄RESET-EFFECT] Same navigation - no reset needed');
    }

    // Update ref to track current image key
    imageKeyRef.current = currentImageKey || null;
  }, [activeNavConfig?.overlayImageKey]); // Only depend on the image key, not full objects

  // Accumulate gold in real-time for display zones
  useEffect(() => {
    if (!goldMiningData) {
      return;
    }

    const targetGold = goldMiningData.currentGold || 0;
    const goldPerHour = goldMiningData.totalGoldPerHour || 0;
    const goldPerMs = goldPerHour / 3600000;

    // Initialize current gold if needed
    if (currentGold === 0 && targetGold > 0) {
      setCurrentGold(targetGold);
    }

    const animate = () => {
      setCurrentGold(prev => {
        const newGold = prev + (goldPerMs * 16.67); // ~60fps
        return Math.min(newGold, targetGold + 1000); // Cap at reasonable value
      });
      goldAnimationRef.current = requestAnimationFrame(animate);
    };

    goldAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (goldAnimationRef.current) {
        cancelAnimationFrame(goldAnimationRef.current);
      }
    };
  }, [goldMiningData]);

  // ============================================================
  // EARLY RETURNS (after all hooks are called)
  // ============================================================

  // Hide navigation on specific pages
  if (shouldHide) {
    return null;
  }

  // Don't render anything if no active navigation
  if (!activeNavConfig || !overlayData) {
    return null;
  }

  // Scale is already stored as decimal multiplier (0.25-2.0)
  const scale = activeNavConfig.scale;
  const scaledWidth = overlayData.imageWidth * scale;
  const scaledHeight = overlayData.imageHeight * scale;

  // Debug logging removed to reduce console spam

  // Filter out only button/clickable zones (not sprites)
  const clickableZones = overlayData.zones.filter((zone: any) => zone.mode === "zone");

  // Get button style classes and content based on configuration
  const getButtonStyle = (zone: any) => {
    const buttonStyle = zone.metadata?.buttonStyle || "none";
    const hoverEffect = zone.metadata?.buttonHoverEffect || "glow";
    const baseStyle = {
      position: 'absolute' as const,
      left: zone.x * scale,
      top: zone.y * scale,
      width: (zone.width || 0) * scale,
      height: (zone.height || 0) * scale,
      cursor: 'pointer',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease',
    };

    // Determine hover class based on hover effect setting
    let hoverClass = 'transition-all active:scale-95 active:shadow-inner';
    switch (hoverEffect) {
      case "glow":
        hoverClass += ' hover:shadow-[0_0_30px_rgba(250,182,23,0.8)]';
        break;
      case "brighten":
        hoverClass += ' hover:brightness-125';
        break;
      case "pulse":
        hoverClass += ' hover:animate-pulse';
        break;
      case "lift":
        hoverClass += ' hover:-translate-y-1 hover:shadow-lg';
        break;
    }

    switch (buttonStyle) {
      case "industrial-yellow":
        return {
          style: {
            ...baseStyle,
            background: 'linear-gradient(135deg, #fab617 0%, #d19912 100%)',
            border: '2px solid #fab617',
            boxShadow: '0 0 20px rgba(250, 182, 23, 0.5)',
            color: '#000',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
          },
          hoverClass,
        };
      case "glowing-blue":
        return {
          style: {
            ...baseStyle,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: '2px solid #3b82f6',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
            color: '#fff',
            fontWeight: 'bold',
          },
          hoverClass,
        };
      case "transparent-outline":
        return {
          style: {
            ...baseStyle,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(250, 182, 23, 0.6)',
            color: '#fab617',
            fontWeight: 'bold',
          },
          hoverClass,
        };
      case "metal-plate":
        return {
          style: {
            ...baseStyle,
            background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
            border: '2px solid #6a6a6a',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5)',
            color: '#fab617',
            fontWeight: 'bold',
          },
          hoverClass,
        };
      case "custom-image":
        return {
          style: baseStyle,
          hoverClass,
        };
      default:
        return {
          style: {
            ...baseStyle,
            background: 'transparent',
          },
          hoverClass: 'hover:bg-yellow-500/10 transition-all active:scale-95',
        };
    }
  };

  // Get font family based on configuration
  const getFontFamily = (font: string) => {
    switch (font) {
      case "orbitron": return "var(--font-orbitron)";
      case "geist-sans": return "var(--font-geist-sans)";
      case "geist-mono": return "var(--font-geist-mono)";
      case "segoe-ui": return "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
      case "segoe-ui-thin": return "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
      default: return "var(--font-orbitron)";
    }
  };

  // Get font weight based on configuration
  const getFontWeight = (font: string) => {
    return font === "segoe-ui-thin" ? 200 : 'bold';
  };

  // Get display value based on zone configuration
  const getDisplayValue = (zone: any): { mainValue: string; decimalValue: string } => {
    const displayType = zone.metadata?.displayType || "gold";
    const decimalPlaces = zone.metadata?.decimalPlaces || 0;

    let rawValue = 0;
    switch (displayType) {
      case "gold":
        rawValue = currentGold;
        break;
      case "cumulative-gold":
        rawValue = goldMiningData?.totalCumulativeGold || 0;
        break;
      case "gold-per-hour":
        rawValue = goldMiningData?.totalGoldPerHour || 0;
        break;
      case "mek-count":
        rawValue = goldMiningData?.ownedMeks?.length || 0;
        break;
      case "essence":
        const essenceType = zone.metadata?.essenceType || "Fire";
        rawValue = essenceData?.essenceBalances?.[essenceType] || 0;
        break;
      default:
        rawValue = 0;
    }

    if (decimalPlaces === 0) {
      return {
        mainValue: Math.floor(rawValue).toLocaleString('en-US'),
        decimalValue: ''
      };
    } else {
      const mainPart = Math.floor(rawValue).toLocaleString('en-US');
      const decimalPart = (rawValue % 1).toFixed(decimalPlaces).slice(2);
      return {
        mainValue: mainPart,
        decimalValue: decimalPart
      };
    }
  };

  // Get color value from config
  const getDisplayColor = (colorName: string): string => {
    switch (colorName) {
      case "yellow": return "#fab617";
      case "white": return "#ffffff";
      case "gold": return "#ffd700";
      case "green": return "#10b981";
      case "blue": return "#3b82f6";
      case "red": return "#ef4444";
      case "orange": return "#f97316";
      default: return "#fab617";
    }
  };

  // Filter out display zones
  const displayZones = overlayData?.zones?.filter((zone: any) => zone.mode === "zone" && zone.type === "display") || [];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        opacity: isPageLoading ? 0 : 1,
        transition: `opacity ${TIMING.FADE_DURATION}ms ease-out`,
        pointerEvents: isPageLoading ? 'none' : 'auto',
      }}
    >
      <div
        className="relative"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {/* Base navigation image */}
        <img
          src={overlayData.imagePath}
          alt="Navigation"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            imageRendering: 'crisp-edges',
          }}
          onLoad={handleImageLoad}
        />

        {/* Render clickable zones - only after image loads */}
        {imageLoaded && clickableZones.map((zone: any) => {
          const buttonConfig = getButtonStyle(zone);
          const buttonStyle = zone.metadata?.buttonStyle || "none";
          const isCustomImage = buttonStyle === "custom-image";

          return (
            <button
              key={zone.id}
              onClick={async () => {
                const action = zone.metadata?.buttonAction;
                const actionData = zone.metadata?.buttonActionData;

                console.log(`Navigation button clicked: ${zone.label || zone.type}`, { action, actionData });

                // Execute configured action
                if (action === "url" && actionData) {
                  router.push(actionData);
                } else if (action === "lightbox" && actionData) {
                  // Get wallet address from encrypted session storage
                  const session = await restoreWalletSession();
                  console.log('[NavigationBar] Session resolved:', session ? 'found' : 'null');
                  const walletAddress = session?.stakeAddress || session?.walletAddress || 'demo_wallet_123';
                  console.log('[NavigationBar] Using wallet:', walletAddress ? walletAddress.slice(0, 15) + '...' : 'demo');
                  window.dispatchEvent(new CustomEvent('openLightbox', {
                    detail: {
                      lightboxId: actionData,
                      walletAddress: walletAddress
                    }
                  }));
                }
              }}
              style={{
                ...buttonConfig.style,
                fontFamily: zone.metadata?.buttonFont ? getFontFamily(zone.metadata.buttonFont) : undefined,
                fontWeight: zone.metadata?.buttonFont ? getFontWeight(zone.metadata.buttonFont) : undefined,
              }}
              className={buttonConfig.hoverClass}
              title={zone.label || zone.type}
              aria-label={zone.label || zone.type}
            >
              {/* Custom image button */}
              {isCustomImage && zone.metadata?.buttonImageUrl && (
                <img
                  src={zone.metadata.buttonImageUrl}
                  alt={zone.label || "Button"}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zone.metadata?.buttonImageScale || 1})`,
                  }}
                />
              )}

              {/* Text button */}
              {!isCustomImage && buttonStyle !== "none" && zone.metadata?.buttonText && (
                <span>{zone.metadata.buttonText}</span>
              )}
            </button>
          );
        })}

        {/* Render sprites (decorative overlays) - only after image loads */}
        {imageLoaded && overlayData.zones
          .filter((zone: any) => zone.mode === "sprite")
          .map((sprite: any) => {
            const spriteScaleValue = sprite.metadata?.spriteScale || 1;

            return (
              <div
                key={sprite.id}
                style={{
                  position: 'absolute',
                  left: sprite.x * scale,
                  top: sprite.y * scale,
                  transform: `scale(${spriteScaleValue * scale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              >
                {sprite.overlayImage && (
                  <img
                    src={sprite.overlayImage}
                    alt={sprite.label || ''}
                    style={{ display: 'block' }}
                  />
                )}
              </div>
            );
          })}

        {/* Render display zones (dynamic text displays) - only after image loads */}
        {imageLoaded && displayZones.map((zone: any) => {
          const fontSize = zone.metadata?.displayFontSize || 32;
          const color = zone.metadata?.displayColor || "yellow";
          const fontFamily = zone.metadata?.displayFont || "geist-mono";
          const textAlign = zone.metadata?.displayAlign || "center";

          const displayValue = getDisplayValue(zone);
          const decimalFontSizePercent = zone.metadata?.decimalFontSizePercent || 50;

          return (
            <div
              key={zone.id}
              style={{
                position: 'absolute',
                left: zone.x * scale,
                top: zone.y * scale,
                width: (zone.width || 0) * scale,
                height: (zone.height || 0) * scale,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
                pointerEvents: 'none',
                fontSize: fontSize * scale,
                color: getDisplayColor(color),
                fontFamily: getFontFamily(fontFamily),
                fontWeight: getFontWeight(fontFamily),
                textShadow: `0 0 15px ${getDisplayColor(color)}80`,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{displayValue.mainValue}</span>
              {displayValue.decimalValue && (
                <>
                  <span>.</span>
                  <span style={{ fontSize: `${decimalFontSizePercent}%` }}>
                    {displayValue.decimalValue}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
