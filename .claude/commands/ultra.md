---
name: ultra
description: Activate all wallet and database debugging agents in parallel
---

Activate these four agents together in parallel to debug wallet connection and database synchronization issues:

**Wallet Integration Team:**
- @cardano-wallet-integrator - Debug wallet connections, NFT extraction, and CIP-30 API issues
- @blockchain-architecture-specialist - Design trustless verification and on-chain integration

**Database Team:**
- @convex-database-architect - Fix Convex queries, mutations, schemas, and reactivity
- @state-sync-debugger - Debug state synchronization between database and UI

This command is perfect for issues involving:
- Wallet connection failures
- NFTs not appearing after wallet connect
- Database updates not reflecting in UI
- Real-time sync problems between blockchain and Convex
- Cumulative gold calculation errors
- Verification status issues

Example usage:
- "/ultra - Eternl wallet won't connect and gold isn't updating"
- "/ultra - NFTs showing in wallet but not in database"
- "/ultra - Leaderboard showing wrong cumulative gold values"
