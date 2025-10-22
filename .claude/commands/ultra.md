---
name: ultra
description: Strategic multi-agent coordination - project lead analyzes issue and selectively activates relevant specialists
---

Launch the @project-lead agent to analyze your problem and strategically activate only the relevant specialist agents needed.

**How it works:**
1. You describe the problem when calling `/ultra`
2. Project-lead analyzes the issue and identifies root causes
3. Project-lead selectively launches ONLY the specialists actually needed
4. Project-lead coordinates their work and integrates solutions

**Available Specialist Agents (project-lead selects from these):**

**Blockchain & Wallet:**
- @cardano-wallet-integrator - Wallet connections, NFT extraction, CIP-30 API
- @blockchain-architecture-specialist - Trustless verification, on-chain integration
- @cardano-nft-specialist - NFT standards (CIP-25/68/67/27), metadata, IPFS
- @nmkr-specialist - NMKR Studio integration, NFT minting, payment widgets

**Database & State:**
- @convex-database-architect - Convex queries, mutations, schemas, reactivity
- @state-sync-debugger - State synchronization between database and UI
- @backend-schema-optimizer - Database design, query optimization, cost reduction

**Code Quality:**
- @code-modularizer - Refactor monolithic code into modular architecture
- @syntax-error-fixer - Fix React/TypeScript/JSX syntax errors

**UI & Design:**
- @scifi-ui-designer - Industrial sci-fi aesthetic, glassmorphism, animations
- @ui-layout-debugger - Layout issues, hydration errors, z-index problems
- @visual-test - Playwright visual regression testing
- @mobile-responsive-optimizer - Mobile-responsive design transformation

**Other Specialists:**
- @canvas-expert - Canvas HTML5 API for image generation
- @discord-game-bot-builder - Discord bot integration with game systems
- @project-lead - (manages coordination when multiple domains involved)

**Example usage:**
- `/ultra - Eternl wallet won't connect and NFTs aren't showing`
  → Project-lead launches: wallet-integrator + state-sync-debugger

- `/ultra - Database queries are slow and costing too much`
  → Project-lead launches: convex-database-architect + backend-schema-optimizer

- `/ultra - UI layout broken on mobile and has syntax errors`
  → Project-lead launches: syntax-error-fixer + mobile-responsive-optimizer + ui-layout-debugger

**Remember:** Project-lead is strategic and selective - it won't launch agents that aren't relevant to your specific issue.
