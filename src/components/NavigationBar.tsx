"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function NavigationBar() {
  const router = useRouter();

  // Get active navigation configuration
  const activeNavConfig = useQuery(api.navigation.getActiveNavigationConfig);

  // Get the overlay data if navigation is active
  const overlayData = useQuery(
    api.overlays.getOverlay,
    activeNavConfig ? { imageKey: activeNavConfig.overlayImageKey } : "skip"
  );

  // Don't render anything if no active navigation
  if (!activeNavConfig || !overlayData) {
    return null;
  }

  // Scale is already stored as decimal multiplier (0.25-2.0)
  const scale = activeNavConfig.scale;
  const scaledWidth = overlayData.imageWidth * scale;
  const scaledHeight = overlayData.imageHeight * scale;

  // Debug logging
  console.log('🔍 [NavigationBar] Config:', {
    scale,
    imageWidth: overlayData.imageWidth,
    imageHeight: overlayData.imageHeight,
    scaledWidth,
    scaledHeight,
    overlayImageKey: activeNavConfig.overlayImageKey,
    isActive: activeNavConfig.isActive
  });

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
      default: return "var(--font-orbitron)";
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
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
        />

        {/* Render clickable zones */}
        {clickableZones.map((zone: any) => {
          const buttonConfig = getButtonStyle(zone);
          const buttonStyle = zone.metadata?.buttonStyle || "none";
          const isCustomImage = buttonStyle === "custom-image";

          return (
            <button
              key={zone.id}
              onClick={() => {
                const action = zone.metadata?.buttonAction;
                const actionData = zone.metadata?.buttonActionData;

                console.log(`Navigation button clicked: ${zone.label || zone.type}`, { action, actionData });

                // Execute configured action
                if (action === "url" && actionData) {
                  router.push(actionData);
                } else if (action === "lightbox" && actionData) {
                  // Dispatch custom event for lightbox opening
                  console.log('[NavigationBar] Dispatching openLightbox event with ID:', actionData);
                  window.dispatchEvent(new CustomEvent('openLightbox', { detail: { lightboxId: actionData } }));
                  console.log('[NavigationBar] Event dispatched');
                }
              }}
              style={{
                ...buttonConfig.style,
                fontFamily: zone.metadata?.buttonFont ? getFontFamily(zone.metadata.buttonFont) : undefined,
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

        {/* Render sprites (decorative overlays) */}
        {overlayData.zones
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
      </div>
    </div>
  );
}
