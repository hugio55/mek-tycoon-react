# PROJECT COORDINATION REPORT
**Date**: October 3, 2025
**Coordinator**: Project Lead Agent
**Team**: 10 Specialist Agents + Project Lead
**Project**: Mek Tycoon - Cardano Blockchain Idle Game

---

## EXECUTIVE SUMMARY

After comprehensive analysis of recent investigations (State Sync Analysis, Gold System Coordination Report) and current codebase state, I can provide strategic coordination for the 11-agent team.

### PROJECT HEALTH: STRONG WITH TARGETED IMPROVEMENTS NEEDED

**Core Systems Status**:
- ✅ **Gold Accumulation System**: Fundamentally sound, working correctly
- ✅ **Convex Reactivity**: Database → Query → UI sync functioning as designed
- ✅ **Race Condition Protection**: Excellent optimistic concurrency control
- ✅ **Data Integrity**: Gold invariants properly maintained
- ⚠️ **Code Organization**: 3,588-line component needs refactoring
- ⚠️ **Animation Dependencies**: Minor issues in hub page
- 🔴 **TypeScript Compilation**: Syntax error blocking builds (CRITICAL)

**Key Insight**: This is NOT a broken system—it's a **working system that needs architectural cleanup and minor bug fixes**. The foundation is solid; we need to improve maintainability and fix edge cases.

---

## CRITICAL PATH: IMMEDIATE BLOCKERS

### 🔴 BLOCKER #1: TypeScript Compilation Error
**File**: `src/app/hub/page-original.tsx:1080-1114`
**Impact**: Blocks production builds
**Severity**: CRITICAL
**Owner**: @syntax-error-fixer
**Priority**: P0 (Immediate)

**Error**:
```
src/app/hub/page-original.tsx(1080,9): error TS1005: '}' expected.
src/app/hub/page-original.tsx(1113,5): error TS1005: ')' expected.
src/app/hub/page-original.tsx(1114,3): error TS1109: Expression expected.
```

**Recommendation**: Fix bracket/parenthesis matching immediately. This is blocking all other work that requires builds.

---

### ⚠️ BLOCKER #2: Missing Component Exports
**File**: `src/app/story-title-demo/page.tsx`
**Impact**: Build warnings, potential runtime errors
**Severity**: MEDIUM
**Owner**: @scifi-ui-designer
**Priority**: P1 (High)

**Missing Exports**:
- HolographicTitle
- CircuitBoardTitle
- GlitchTitle
- NeonCyberpunkTitle
- MilitaryHUDTitle

**Recommendation**: Either export these components from `@/components/StoryModeTitleCards` or remove demo page if no longer needed.

---

## PRIORITY TASK LIST WITH DEPENDENCIES

### PHASE 1: CRITICAL FIXES (Immediate - 4-6 hours)

#### Task 1.1: Fix TypeScript Compilation Blocker
**Owner**: @syntax-error-fixer
**Dependencies**: None
**Estimated Time**: 30 minutes
**Deliverable**: Clean TypeScript compilation

**Action**:
1. Read `src/app/hub/page-original.tsx` lines 1070-1120
2. Identify missing/mismatched brackets/parentheses
3. Fix syntax errors
4. Verify with `npx tsc --noEmit`

**Integration Point**: BLOCKS ALL SUBSEQUENT WORK requiring builds

---

#### Task 1.2: Fix Hub Animation Dependencies
**Owner**: @state-sync-debugger
**Dependencies**: None (can run parallel to 1.1)
**Estimated Time**: 1 hour
**Deliverable**: Corrected useEffect dependency arrays

**Action** (from STATE_SYNC_INVESTIGATION_REPORT.md recommendations):
```typescript
// src/app/hub/page.tsx:321-350
// Add missing dependencies to effect
const isVerified = verificationStatus?.isVerified === true;

useEffect(() => {
  if (goldPerSecond > 0 && isVerified && liveGold !== null) {
    // ... animation code
  }
}, [goldPerSecond, isVerified, liveGold, cachedGoldData, walletAddress, isDemoMode]);
// ✅ All used variables in deps
```

**Impact**: Prevents animation from freezing when verification status changes unexpectedly.

---

#### Task 1.3: Add Missing Component Exports
**Owner**: @scifi-ui-designer
**Dependencies**: None (can run parallel)
**Estimated Time**: 30 minutes
**Deliverable**: Clean build without warnings

**Action**:
1. Check if `story-title-demo` page is still needed
2. If yes: Export missing components from `@/components/StoryModeTitleCards`
3. If no: Delete `src/app/story-title-demo/page.tsx`

---

### PHASE 2: DATA INTEGRITY & SYNC IMPROVEMENTS (Short-term - 2-3 days)

#### Task 2.1: Unify Gold Rate Data Source
**Owner**: @convex-database-architect + @state-sync-debugger (coordination required)
**Dependencies**: Phase 1 complete
**Estimated Time**: 2-3 hours
**Deliverable**: Single source of truth for gold rates

**Problem Identified** (from STATE_SYNC_INVESTIGATION_REPORT.md):
- Hub page reads from `users.goldPerHour`
- Mek rate logging reads from `goldMining.totalGoldPerHour`
- These can diverge after level upgrades

**Recommended Solution**:
```typescript
// hub/page.tsx - Switch to goldMining data source
const goldMiningData = useQuery(
  api.goldMining.getGoldMiningData,
  walletAddress ? { walletAddress } : "skip"
);

useEffect(() => {
  if (goldMiningData) {
    const goldPerSecond = goldMiningData.totalGoldPerHour / 3600;
    setGoldPerSecond(goldPerSecond);
  }
}, [goldMiningData]);
```

**Integration Point**: Both specialists must agree on data flow architecture.

---

#### Task 2.2: Fix Cumulative Gold Calculation Drift
**Owner**: @state-sync-debugger
**Dependencies**: Task 2.1 complete (uses same query pattern)
**Estimated Time**: 1-2 hours
**Deliverable**: Accurate cumulative gold tracking

**Problem Identified**:
- Frontend manually calculates cumulative gold in animation loop
- Can drift from database value due to rounding, cap overflow handling
- Example: When gold hits 50k cap, frontend calculation loses track of gold "lost to cap"

**Recommended Solution**:
```typescript
// mek-rate-logging/page.tsx - Stop calculating, read from DB
useEffect(() => {
  const updateGold = () => {
    if (goldMiningData) {
      const calculatedGold = calculateCurrentGold({...});
      setCurrentGold(calculatedGold);

      // ✅ Read cumulative directly from database (always correct)
      const databaseCumulative = goldMiningData.totalCumulativeGold || 0;
      setCumulativeGold(databaseCumulative);
    }
  };

  const interval = setInterval(updateGold, 16.67);
  return () => clearInterval(interval);
}, [walletConnected, goldMiningData, walletAddress]);
```

**Impact**: Eliminates cumulative gold drift over time.

---

#### Task 2.3: Add Comprehensive Diagnostic Logging
**Owner**: @convex-database-architect
**Dependencies**: None (can run parallel to other tasks)
**Estimated Time**: 2 hours
**Deliverable**: Strategic logging at mutation/query/frontend boundaries

**Action** (from STATE_SYNC_INVESTIGATION_REPORT.md):
1. Add logging to `convex/mekLeveling.ts` mutations (entry/exit, before/after state)
2. Add logging to `convex/goldMining.ts` queries (when called, what returned)
3. Add logging to frontend animation loops (gold updates, rate changes)
4. Add logging to wallet connection flows

**Value**: Makes state sync flow visible, easier to debug future issues.

---

### PHASE 3: CODE ORGANIZATION & MAINTAINABILITY (Medium-term - 2-3 weeks)

#### Task 3.1: Extract Custom Hooks from Mek Rate Logging Page
**Owner**: @code-modularizer
**Dependencies**: Phase 2 complete (ensures clean state before refactoring)
**Estimated Time**: 6-8 hours
**Deliverable**: Reduce component from 3,588 → ~800 lines

**Current State** (from STATE_SYNC_ANALYSIS.md):
- 3,588 lines in single component
- 22 useEffect hooks
- Duplicate state variables for same data
- Complex animation logic scattered throughout

**Refactoring Plan**:
1. Extract `useWalletConnection()` hook (wallet detection, connection, auto-reconnect) - 200 lines
2. Extract `useGoldAnimation()` hook (smooth gold counting) - 100 lines
3. Extract `useMekLevelSync()` hook (MEK level data sync) - 150 lines
4. Extract `useUpgradeAnimations()` hook (upgrade visual feedback) - 100 lines

**Success Criteria**:
- Main component drops to ~800 lines
- Effect count reduces from 22 → 8
- All functionality preserved (no behavior changes)

**Integration Point**: @state-sync-debugger to validate all hooks work correctly after extraction.

---

#### Task 3.2: Remove Redundant State Variables
**Owner**: @code-modularizer
**Dependencies**: Task 3.1 (hooks provide cleaner state management)
**Estimated Time**: 2 hours
**Deliverable**: Simplified state management

**Action**:
```typescript
// BEFORE (3 state variables for same data)
const [currentGold, setCurrentGold] = useState(0);
const [goldPerHour, setGoldPerHour] = useState(0);
const [refreshGold, setRefreshGold] = useState(0);

// AFTER (derive from query)
const currentGold = useMemo(() =>
  calculateCurrentGold(goldMiningData),
  [goldMiningData]
);
const goldPerHour = goldMiningData?.totalGoldPerHour ?? 0;
```

**Impact**: Reduces state updates, eliminates sync issues between redundant variables.

---

#### Task 3.3: Split Mek Rate Logging into Sub-Components
**Owner**: @code-modularizer
**Dependencies**: Task 3.1 & 3.2 complete
**Estimated Time**: 8-12 hours
**Deliverable**: Modular component architecture

**Component Breakdown**:
- `<WalletConnectionPanel />` - wallet UI and logic
- `<GoldDisplay />` - animated gold counter
- `<MekGrid />` - MEK list and upgrades
- `<VerificationPanel />` - blockchain verification

**Value**: Each component can be developed, tested, and debugged independently.

---

### PHASE 4: ERROR HANDLING & RESILIENCE (Ongoing - 1 week)

#### Task 4.1: Add Error Boundaries
**Owner**: @syntax-error-fixer
**Dependencies**: None (can run parallel)
**Estimated Time**: 2 hours
**Deliverable**: Graceful error handling for query failures

**Action**:
```typescript
<ErrorBoundary fallback={<GoldLoadError />}>
  <GoldDisplay goldMiningData={goldMiningData} />
</ErrorBoundary>
```

**Impact**: Prevents white screen crashes when queries fail.

---

#### Task 4.2: Handle Network Failures Gracefully
**Owner**: @state-sync-debugger
**Dependencies**: Task 4.1 complete
**Estimated Time**: 2 hours
**Deliverable**: Retry logic, loading states

**Action**:
```typescript
if (!goldMiningData && walletAddress) {
  return <LoadingSpinner message="Loading gold data..." />;
}

if (queryError) {
  return <ErrorState error={queryError} onRetry={refetch} />;
}
```

---

### PHASE 5: UI/UX POLISH (Low priority - Ongoing)

#### Task 5.1: Apply Industrial Design System Consistently
**Owner**: @scifi-ui-designer
**Dependencies**: None (can run parallel)
**Estimated Time**: Ongoing
**Deliverable**: Consistent visual identity across all pages

**Reference**: Design system defined in `/src/styles/global-design-system.css`

**Action**: Audit all pages for design system compliance, update as needed.

---

#### Task 5.2: Mobile Responsive Optimization
**Owner**: @mobile-responsive-optimizer
**Dependencies**: Task 5.1 (design system applied)
**Estimated Time**: Ongoing
**Deliverable**: Mobile-friendly layouts

**Focus Areas**:
- Hub page gold display
- Mek grid responsiveness
- Navigation on mobile
- Wallet connection UI on small screens

---

#### Task 5.3: Visual Testing and Verification
**Owner**: @visual-test
**Dependencies**: All other phases
**Estimated Time**: Ongoing
**Deliverable**: Visual regression testing

**Action**: Use `/visual-check` command after major UI changes to verify:
- Animations working smoothly
- No console errors
- Interactions responding correctly
- Responsive breakpoints functioning

---

## TEAM ASSIGNMENTS & SEQUENCING

### IMMEDIATE ACTION (Week 1)

**@syntax-error-fixer** (P0 - CRITICAL):
- Task 1.1: Fix TypeScript compilation blocker (30 min)
- Task 4.1: Add error boundaries (2 hours)

**@state-sync-debugger** (P1 - HIGH):
- Task 1.2: Fix hub animation dependencies (1 hour)
- Task 2.2: Fix cumulative gold calculation drift (1-2 hours)

**@scifi-ui-designer** (P1 - HIGH):
- Task 1.3: Add missing component exports (30 min)

**@convex-database-architect** (P1 - HIGH):
- Task 2.1: Unify gold rate data source (2-3 hours)
- Task 2.3: Add diagnostic logging (2 hours)

---

### SHORT-TERM (Weeks 2-3)

**@code-modularizer** (P2 - MEDIUM):
- Task 3.1: Extract custom hooks (6-8 hours)
- Task 3.2: Remove redundant state (2 hours)
- Task 3.3: Split into sub-components (8-12 hours)

**@state-sync-debugger** (P2 - MEDIUM):
- Task 4.2: Handle network failures (2 hours)
- Validation: Verify hooks from Task 3.1 work correctly

---

### ONGOING (Background Work)

**@scifi-ui-designer** (P3 - LOW):
- Task 5.1: Apply industrial design system (ongoing)

**@mobile-responsive-optimizer** (P3 - LOW):
- Task 5.2: Mobile responsive optimization (ongoing)

**@visual-test** (P3 - LOW):
- Task 5.3: Visual testing and verification (ongoing)

**@ui-layout-debugger** (STANDBY):
- On-call for layout issues as they arise

**@cardano-wallet-integrator** (STANDBY):
- Currently no wallet integration work needed (system working)

**@blockchain-architecture-specialist** (STANDBY):
- Currently no smart contract work needed

---

## INTEGRATION POINTS & RISKS

### Integration Point 1: Database Query Unification
**Teams Involved**: @convex-database-architect + @state-sync-debugger
**Risk Level**: MEDIUM
**Coordination Required**: YES

**What**: Both hub page and mek-rate-logging page need to use same data source (`goldMining.totalGoldPerHour`)

**Coordination Strategy**:
1. Database Architect designs unified query pattern
2. State Sync Specialist implements on both pages
3. Joint testing to verify both pages show identical rates

**Failure Mode**: If not coordinated, pages could still show different rates.

---

### Integration Point 2: Hook Extraction Validation
**Teams Involved**: @code-modularizer + @state-sync-debugger
**Risk Level**: MEDIUM
**Coordination Required**: YES

**What**: After extracting hooks, ensure state synchronization still works correctly

**Coordination Strategy**:
1. Code Modularizer extracts one hook at a time
2. State Sync Specialist validates after each extraction
3. Don't proceed to next hook until validation passes

**Failure Mode**: Breaking state sync during refactoring could cause gold calculation errors.

---

### Integration Point 3: Visual Design Consistency
**Teams Involved**: @scifi-ui-designer + @visual-test
**Risk Level**: LOW
**Coordination Required**: LIGHT

**What**: Visual changes should be tested in browser before merging

**Coordination Strategy**:
1. UI Designer makes changes
2. Visual Test agent verifies with `/visual-check`
3. Screenshots captured for approval

**Failure Mode**: Visual regressions slip through to production.

---

## DEPENDENCIES GRAPH

```
┌─────────────────────────────────────────────────────────────────┐
│ CRITICAL PATH (Week 1)                                          │
└─────────────────────────────────────────────────────────────────┘

Task 1.1: Fix TypeScript Error (30 min)
  ↓ BLOCKS ALL BUILD-DEPENDENT WORK
Task 1.2: Fix Animation Deps (1 hour) ← Can run parallel to 1.1
  ↓
Task 2.1: Unify Gold Rate Source (2-3 hours)
  ↓
Task 2.2: Fix Cumulative Drift (1-2 hours)
  ↓
Task 2.3: Add Diagnostic Logging (2 hours) ← Can run parallel

┌─────────────────────────────────────────────────────────────────┐
│ REFACTORING PATH (Weeks 2-3)                                    │
└─────────────────────────────────────────────────────────────────┘

Phase 2 Complete
  ↓
Task 3.1: Extract Hooks (6-8 hours)
  ↓ Validate with State Sync Specialist
Task 3.2: Remove Redundant State (2 hours)
  ↓
Task 3.3: Split Components (8-12 hours)
  ↓ Validate with State Sync Specialist

┌─────────────────────────────────────────────────────────────────┐
│ PARALLEL WORK (Ongoing)                                         │
└─────────────────────────────────────────────────────────────────┘

Task 4.1: Error Boundaries (2 hours) ← No dependencies
Task 4.2: Network Failure Handling (2 hours)
Task 5.1: Design System Application (ongoing)
Task 5.2: Mobile Optimization (ongoing)
Task 5.3: Visual Testing (ongoing)
```

---

## RISK MANAGEMENT

### Risk 1: Breaking Working System During Refactoring
**Probability**: MEDIUM
**Impact**: HIGH
**Mitigation**:
- Incremental refactoring (one hook at a time)
- Continuous testing after each change
- State Sync Specialist validates after each extraction
- Keep all tests passing throughout

---

### Risk 2: State Sync Regressions After Query Changes
**Probability**: LOW
**Impact**: HIGH
**Mitigation**:
- Comprehensive diagnostic logging (Task 2.3)
- Manual testing checklist (upgrade MEK → verify both pages update)
- Automated tests for gold calculations

---

### Risk 3: Team Coordination Failures
**Probability**: LOW
**Impact**: MEDIUM
**Mitigation**:
- Clear ownership assignments
- Explicit integration points documented
- Project Lead monitors handoffs
- Daily standups (if needed)

---

### Risk 4: Scope Creep During Refactoring
**Probability**: MEDIUM
**Impact**: MEDIUM
**Mitigation**:
- Strict "no behavior changes" rule during refactoring
- Separate PRs for bugs vs refactoring
- Focus on Phase 1-2 before Phase 3

---

## SUCCESS METRICS

### Correctness Metrics (Already Passing ✅)
- Gold calculations accurate: **PASS**
- Invariants maintained: **PASS**
- Race conditions prevented: **PASS**
- Reactivity working: **PASS**
- No data loss: **PASS**

### Phase 1 Success Criteria (Week 1)
- [ ] TypeScript compiles without errors
- [ ] Build completes without warnings
- [ ] Animation dependencies complete
- [ ] No stale closure issues

### Phase 2 Success Criteria (Weeks 2-3)
- [ ] Hub page and mek-rate-logging show identical gold rates
- [ ] Cumulative gold matches database exactly
- [ ] Diagnostic logs provide visibility into state sync
- [ ] Error boundaries prevent crashes

### Phase 3 Success Criteria (Weeks 3-4)
- [ ] Mek rate logging reduced from 3,588 → 800 lines
- [ ] Effect count reduced from 22 → 8
- [ ] State variables reduced by 60%
- [ ] All functionality preserved (no regressions)

### Phase 4 Success Criteria (Week 4)
- [ ] Query failures handled gracefully
- [ ] Network disconnections don't crash app
- [ ] Error states show retry options
- [ ] Loading states prevent blank screens

---

## COMMUNICATION PROTOCOL

### Daily Coordination (Async)
Each specialist reports in project chat:
1. **Completed**: What shipped yesterday?
2. **In Progress**: What's being worked on today?
3. **Blockers**: What's preventing progress?

Project Lead focuses on #3, resolves cross-specialist blockers.

---

### Integration Reviews (Weekly)
Project Lead facilitates:
- Demo of integrated functionality
- Discussion of upcoming integration points
- Architectural decisions requiring multi-specialist input
- Risk identification for next week's work

---

### Architectural Decisions
For significant technical choices:
- Project Lead presents problem space and constraints
- Specialists propose solutions
- Project Lead decides using advice process (after gathering input)
- Decision documented in ADR (Architectural Decision Record)

---

## RECOMMENDED NEXT STEPS (IMMEDIATE)

### For User:
1. **Approve this coordination plan** or provide feedback
2. **Prioritize**: Confirm Phase 1 is the correct starting point
3. **Resource allocation**: Are all specialists available for their assignments?

### For Specialists:
1. **@syntax-error-fixer**: Start immediately on Task 1.1 (TypeScript error)
2. **@state-sync-debugger**: Start Task 1.2 (animation dependencies) in parallel
3. **@scifi-ui-designer**: Start Task 1.3 (missing exports) in parallel
4. **@convex-database-architect**: Review Task 2.1 (gold rate unification), prepare implementation plan

### For Project Lead (Self):
1. Monitor Phase 1 progress daily
2. Identify and resolve blockers within 24 hours
3. Coordinate handoff between Phase 1 → Phase 2
4. Update this report as work progresses

---

## APPENDICES

### A. Key File Locations
- **Gold Mining Logic**: `convex/goldMining.ts`
- **Gold Calculations**: `convex/lib/goldCalculations.ts`
- **Mek Leveling**: `convex/mekLeveling.ts`
- **Main UI (Needs Refactoring)**: `src/app/mek-rate-logging/page.tsx` (3,588 lines)
- **Hub Page (Needs Fixes)**: `src/app/hub/page.tsx`
- **Syntax Error (BLOCKER)**: `src/app/hub/page-original.tsx` lines 1080-1114

### B. Related Investigation Documents
- `STATE_SYNC_ANALYSIS.md` - Detailed state synchronization analysis (670 lines)
- `GOLD_SYSTEM_COORDINATION_REPORT.md` - Gold system validation (568 lines)
- `STATE_SYNC_INVESTIGATION_REPORT.md` - Sync issues investigation (897 lines)

### C. Design System Reference
- `src/styles/global-design-system.css` - Industrial design patterns
- `src/lib/design-system.ts` - Design system utilities

### D. Architectural Decision Records
- To be created: ADR-001 through ADR-00X as decisions are made

---

## CONCLUSION

The Mek Tycoon project is in **strong health** with a solid foundation. The gold accumulation system works correctly, Convex reactivity functions as designed, and data integrity is maintained. The challenges are:

1. **One critical blocker** (TypeScript syntax error)
2. **Minor state sync issues** (animation dependencies, dual data sources)
3. **Code organization debt** (3,588-line component)

**This is NOT a crisis—it's a maintenance and optimization opportunity.**

The recommended 5-phase approach addresses issues incrementally:
- Phase 1 fixes critical blockers (1 week)
- Phase 2 improves data integrity (2-3 days)
- Phase 3 refactors for maintainability (2-3 weeks)
- Phase 4 adds resilience (1 week)
- Phase 5 polishes UI (ongoing)

**Total estimated time**: 4-6 weeks for all phases, but Phase 1-2 (critical fixes) complete in ~2 weeks.

**No system rewrites needed**. All improvements can be made incrementally while keeping the system running.

---

**Report Status**: COMPLETE
**Prepared By**: Project Lead Agent
**Date**: October 3, 2025
**Next Review**: After Phase 1 completion (1 week)
