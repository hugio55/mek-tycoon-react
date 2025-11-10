# Mek Tycoon Landing Page - Implementation Plan

## Overview
Create a public-facing landing page that will serve as the first impression for all visitors to mektycoon.com and mek.overexposed.io. This page will replace the current root page while preserving the existing game interface underneath for authenticated users.

## Technical Strategy

### URL Structure
- **Development**: `/landing` - Work on landing page here
- **Production**: `/` - Landing page becomes the root
- **Game Interface**: `/home` - Existing game (protected, requires login/NFT)

### Routing Architecture
```
Current State:
mektycoon.com/ → Current root page (game interface)

Future State:
mektycoon.com/ → New landing page (public)
mektycoon.com/home → Game interface (protected)
mek.overexposed.io/ → Redirects to mektycoon.com/
```

### Implementation Steps
1. Create `/landing` route in Next.js App Router
2. Build landing page separately from main game
3. Test thoroughly at `/landing`
4. When ready to launch:
   - Move current root page content to `/home` (if not already)
   - Replace root `/` with landing page content
   - Set up redirects for mek.overexposed.io
   - Implement authentication gates for game pages

## Design Requirements

### Purpose
- Build anticipation for the full game launch
- Introduce Mek Tycoon concept to new visitors
- Collect interest (email signup, Discord link, etc.)
- Showcase the industrial/futuristic aesthetic
- Explain NFT integration without overwhelming

### Visual Style
- **Aesthetic**: Industrial/Military (matching existing design system)
- **Colors**: Black, yellow/gold (#fab617), deep grays
- **Typography**: Orbitron for headers, clean sans-serif for body
- **Effects**: Glass-morphism, subtle animations, grunge textures
- **Components**: Sharp-edged frames with yellow borders, hazard stripes

### Key Elements to Include
- [ ] Hero section with bold headline and tagline
- [ ] Brief explanation of "What is Mek Tycoon?"
- [ ] Showcase of Mek visuals (static images or subtle animations)
- [ ] Key features/selling points (3-5 bullet points)
- [ ] Call-to-action (Discord link, email signup, "Coming Soon")
- [ ] Social links (Twitter, Discord, etc.)
- [ ] Footer with basic info

### Technical Constraints
- Must be fully public (no authentication required)
- Should load quickly (minimal dependencies)
- Responsive design (mobile + desktop)
- No access to game data/Convex (this is pre-login)
- Use existing design system classes from `/src/styles/global-design-system.css`

## Content Structure (Draft)

### Hero Section
- **Headline**: "MEK TYCOON" (large, industrial font)
- **Tagline**: TBD - something about building an empire with collectible Mekanisms
- **Visual**: Background featuring Mek image or industrial texture
- **CTA**: "Join the Discord" or "Stay Updated"

### About Section
- Brief paragraph explaining the game concept
- Mention: Idle/tycoon mechanics, collectible Meks, crafting, resource management
- Emphasize: Unique industrial aesthetic, strategy elements

### Features Section
- Collect Resources
- Craft Variations
- Build Your Empire
- Trade & Compete

### Visual Showcase
- 3-5 Mek images displayed in industrial frames
- Show variety of head/body/trait combinations
- Demonstrate the art style and quality

### Community Section
- Discord invite link (primary CTA)
- Twitter/X link
- "Join our growing community of collectors"

### Footer
- Copyright notice
- Links to privacy policy, terms (if needed)
- Contact info

## Implementation Files

### New Files to Create
- `/src/app/landing/page.tsx` - Main landing page component
- `/src/app/landing/layout.tsx` - Minimal layout (no game nav/UI)

### Files to Modify (Later, when going live)
- `/src/app/page.tsx` - Will become the landing page (or redirect to it)
- `/src/app/home/page.tsx` - Ensure game interface is protected
- Next.js middleware for authentication/routing

### Design System Resources (Already Exist)
- `/src/styles/global-design-system.css` - Industrial classes
- `/src/lib/design-system.ts` - Theme utilities
- `/public/mek-images/` - Mek visuals to showcase

## Authentication Strategy

### Current State
- Game is publicly accessible at root URL
- No login/wallet requirement currently enforced

### Future State (After Landing Page Launch)
- Landing page is public (no auth needed)
- Game pages require authentication (wallet connection or login)
- Middleware checks for auth before allowing access to `/home`, `/profile`, etc.

### Implementation Options
1. **Wallet-based**: Require Cardano wallet connection (MeshSDK currently disabled)
2. **Discord OAuth**: Login via Discord account
3. **Email signup**: Simple email-based access
4. **NFT gating**: Require owning a Mek NFT to access game
5. **Hybrid**: Multiple auth methods supported

**Decision Needed**: Which authentication method(s) to implement?

## Domain & Hosting

### Domains
- **Primary**: mektycoon.com (new, to be revealed)
- **Legacy**: mek.overexposed.io (existing, keep active for bookmarks)

### Redirect Strategy
- mek.overexposed.io → mektycoon.com (301 permanent redirect)
- Preserve any deep links (e.g., /profile redirects to mektycoon.com/profile)

### DNS/Hosting Tasks
- Point mektycoon.com to Vercel/hosting platform
- Set up redirect from mek.overexposed.io
- SSL certificates for both domains
- Test both domains after launch

## Development Workflow

### Phase 1: Build Landing Page (Current)
1. Create `/landing` route
2. Design and implement landing page
3. Test locally at `localhost:3200/landing`
4. Get user approval on design/content

### Phase 2: Prepare for Launch
1. Finalize copy/content
2. Add final images/assets
3. Test on both domains (staging)
4. Implement authentication for game pages
5. Set up redirects

### Phase 3: Go Live
1. Move landing page to root URL
2. Activate domain redirects
3. Test thoroughly on both domains
4. Monitor for issues
5. Announce on Discord/social media

## Questions to Resolve

### Content Questions
- [ ] Exact headline and tagline for hero section
- [ ] Key features to highlight (3-5 main selling points)
- [ ] Social media links (Discord, Twitter, etc.)
- [ ] Any teaser content about launch date or timeline
- [ ] Email signup form needed? If so, what service (Mailchimp, ConvertKit, etc.)

### Design Questions
- [ ] Specific Mek images to showcase (which variations?)
- [ ] Video/animation on landing page, or static images only?
- [ ] "Coming Soon" vs "Join Now" messaging
- [ ] Any countdown timer to launch date?

### Technical Questions
- [ ] Which authentication method(s) for game access after launch?
- [ ] Analytics tracking (Google Analytics, Plausible, etc.)?
- [ ] Capture email addresses? Need backend for this?
- [ ] Any teaser gameplay or interactive elements on landing page?

## Success Criteria

### Landing Page Must:
- Load in under 2 seconds on average connection
- Look great on mobile and desktop
- Clearly communicate what Mek Tycoon is
- Provide clear call-to-action (Discord, email, etc.)
- Match the industrial aesthetic of the main game
- Work on both mektycoon.com and mek.overexposed.io
- Not break existing game functionality (underneath)

### Launch Checklist:
- [ ] Landing page design approved
- [ ] Content finalized and proofread
- [ ] All images optimized and loaded
- [ ] Both domains tested and working
- [ ] Redirects functioning correctly
- [ ] Game pages properly protected (if auth implemented)
- [ ] Social media posts prepared
- [ ] Discord announcement ready
- [ ] Analytics tracking active (if using)

## Timeline

### Immediate Next Steps
1. Review this plan document
2. Decide on key content (headlines, features, CTAs)
3. Select Mek images to showcase
4. Create `/landing` route and basic structure
5. Iterate on design until approved

### Before Launch
- Finalize all content and copy
- Complete authentication implementation (if needed)
- Set up domain redirects
- Run final tests on staging environment
- Prepare announcement materials

## Notes
- Existing game content at `/home` remains fully functional
- Landing page is completely separate - won't affect game code
- Can develop and test `/landing` without disrupting current site
- When ready to go live, it's a simple routing change + redirect setup
- User maintains full control of when to flip the switch

## Reference Files
- Design system: `/src/styles/global-design-system.css`
- Example industrial page: `/src/app/contracts/single-missions/page.tsx`
- Mek images: `/public/mek-images/`
- Variation data: `/src/lib/completeVariationRarity.ts`
