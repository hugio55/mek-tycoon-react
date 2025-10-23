---
name: ultra
description: Activate all wallet and database debugging agents in parallel
---

Use the Task tool to launch the project-lead agent with the following prompt:

"Analyze the user's issue and coordinate specialist agents to solve it. Follow these steps:

1. **ANALYZE THE PROBLEM**: Read relevant files, understand the scope, and identify root causes
2. **DETERMINE NEEDED SPECIALISTS**: Based on your analysis, decide which agents are required:

**Wallet Integration Team:**
- cardano-wallet-integrator - Debug wallet connections, NFT extraction, CIP-30 API issues
- blockchain-architecture-specialist - Design trustless verification, on-chain integration

**Database Team:**
- convex-database-architect - Fix Convex queries, mutations, schemas, reactivity
- state-sync-debugger - Debug state sync between database and UI

**Code Quality Team:**
- code-modularizer - Refactor monolithic code into modular architecture
- syntax-error-fixer - Fix syntax errors, bracket mismatches, parsing errors

**UI & Design Team:**
- scifi-ui-designer - Apply industrial sci-fi aesthetic and design systems
- ui-layout-debugger - Debug layout issues, positioning, responsive design
- visual-test - Verify visual changes in browser, check console errors
- mobile-responsive-optimizer - Transform desktop UI to mobile-responsive design

3. **LAUNCH SPECIALIST AGENTS**: Use the Task tool with appropriate subagent_type to launch ONLY the relevant specialists you identified. Launch agents in parallel when they work on independent parts.

4. **COORDINATE & INTEGRATE**: Review specialist outputs, ensure integration points work together, resolve conflicts, and deliver a unified solution.

**CRITICAL**: You MUST use the Task tool to actually launch specialist agents - don't just recommend them. Be strategic and selective - only launch what's actually needed for this specific issue.

User's issue: {user's description}"
