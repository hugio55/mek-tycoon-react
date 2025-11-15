interface LandingFooterProps {
  footerHeight: number;
  socialIconPaddingTop: number;
  socialIconPaddingBottom: number;
  mobilePhaseFooterSpacing: number;
  footerBlurAmount: number;
  footerImageVerticalPosition: number;
  oeLogoScale: number;
  socialIconScale: number;
  socialIconGap: number;
  socialIconVerticalPosition: number;
  footerEdgeFeathering: number;
  phaseColumnYOffset: number;
  phaseColumnHeight: number;
  isMobile: boolean;
  oeLogoUrl?: string;
  discordUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

export default function LandingFooter({
  footerHeight,
  socialIconPaddingTop,
  socialIconPaddingBottom,
  mobilePhaseFooterSpacing,
  footerBlurAmount,
  footerImageVerticalPosition,
  oeLogoScale,
  socialIconScale,
  socialIconGap,
  socialIconVerticalPosition,
  footerEdgeFeathering,
  phaseColumnYOffset,
  phaseColumnHeight,
  isMobile,
  oeLogoUrl,
  discordUrl,
  twitterUrl,
  websiteUrl,
}: LandingFooterProps) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: `${footerHeight}px`,
        paddingTop: `${socialIconPaddingTop}px`,
        paddingBottom: `${socialIconPaddingBottom}px`,
        marginTop: isMobile ? `${mobilePhaseFooterSpacing}px` : undefined,
        backdropFilter: (() => {
          const blurValue = `blur(${footerBlurAmount}px) saturate(180%)`;
          console.log('[🔍BLUR-SYNC] Step 5 - Applying footerBlurAmount as CSS backdropFilter:', blurValue);
          return blurValue;
        })(),
        WebkitBackdropFilter: `blur(${footerBlurAmount}px) saturate(180%)`,
        backgroundColor: 'rgba(17, 24, 39, 0.3)',
        position: isMobile ? 'relative' : 'absolute',
        top: isMobile ? 0 : `calc(100vh + ${phaseColumnYOffset}px + ${phaseColumnHeight}px)`,
        left: 0,
        width: '100%',
        zIndex: 2,
      }}
    >
      {/* OE Logo */}
      <div
        className="absolute"
        style={{
          top: `${footerImageVerticalPosition}%`,
          transform: 'translateY(-50%)',
          left: '50%',
          marginLeft: `-${50 * oeLogoScale}px`,
          cursor: oeLogoUrl && oeLogoUrl !== '#' ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (oeLogoUrl && oeLogoUrl !== '#') {
            window.open(oeLogoUrl, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <img
          src="/oe-items/oe-icon.png"
          alt="OE Icon"
          style={{
            width: `${100 * oeLogoScale}px`,
            height: 'auto',
          }}
          onError={(e) => {
            console.error('[🖼️FOOTER] Failed to load OE icon');
          }}
        />
      </div>

      {/* Social Icons */}
      <div
        className="absolute flex items-center"
        style={{
          top: `${socialIconVerticalPosition}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          gap: `${socialIconGap}px`,
        }}
      >
        {/* Discord Icon */}
        <div
          onClick={() => {
            if (discordUrl && discordUrl !== 'https://discord.gg/your-discord') {
              window.open(discordUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="hover:opacity-70 transition-opacity"
          style={{
            cursor: discordUrl && discordUrl !== 'https://discord.gg/your-discord' ? 'pointer' : 'default',
          }}
        >
          <svg
            width={40 * socialIconScale}
            height={40 * socialIconScale}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-gray-400"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>

        {/* X (Twitter) Icon */}
        <div
          onClick={() => {
            if (twitterUrl && twitterUrl !== 'https://twitter.com/your-twitter') {
              window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="hover:opacity-70 transition-opacity"
          style={{
            cursor: twitterUrl && twitterUrl !== 'https://twitter.com/your-twitter' ? 'pointer' : 'default',
          }}
        >
          <svg
            width={40 * socialIconScale}
            height={40 * socialIconScale}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-gray-400"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>

        {/* Globe (Website) Icon */}
        <div
          onClick={() => {
            if (websiteUrl && websiteUrl !== 'https://your-website.com') {
              window.open(websiteUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="hover:opacity-70 transition-opacity"
          style={{
            cursor: websiteUrl && websiteUrl !== 'https://your-website.com' ? 'pointer' : 'default',
          }}
        >
          <svg
            width={40 * socialIconScale}
            height={40 * socialIconScale}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
      </div>

      {/* Edge Feathering - Gradient fade at top of footer */}
      {footerEdgeFeathering > 0 && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `-${footerEdgeFeathering}px`,
            height: `${footerEdgeFeathering}px`,
            background: 'linear-gradient(to bottom, transparent, rgba(17, 24, 39, 0.3))',
          }}
        />
      )}
    </div>
  );
}
