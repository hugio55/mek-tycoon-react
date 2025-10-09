# Visual Testing Guide: 240+ NFT Verification Fix

## Quick Start

### 1. Start the application
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"
npm run dev:all
```
Wait for the app to start on http://localhost:3100

### 2. Run the comprehensive test suite
```bash
npx playwright test tests/large-collection-verification.spec.ts
```

## Test Scenarios Covered

### Scenario 1: Small Collection (5 NFTs)
- **Expected**: Completes in 5-10 seconds
- **Success Criteria**: Green button, success toast appears
- **Screenshots**: `scenario-1-initial-state.png`, `scenario-1-loading-state.png`, `scenario-1-success-state.png`

### Scenario 2: Medium Collection (75 NFTs)
- **Expected**: Completes in 10-20 seconds
- **Success Criteria**: Progress messages update, success state reached
- **Screenshots**: `scenario-2-mid-verification.png`, `scenario-2-success-state.png`

### Scenario 3: Large Collection (240 NFTs) - CRITICAL
- **Expected**: Completes in 20-45 seconds WITHOUT ctx.query/ctx.db errors
- **Success Criteria**:
  - No database errors in console
  - Button turns green
  - Success toast shows "240 MEKs successfully verified"
  - Wallet MEKs: 240
  - Blockchain MEKs: 240
- **Screenshots**: `scenario-3-large-collection-loading.png`, `scenario-3-success-240-meks.png`
- **This validates the scheduler-based fix!**

### Scenario 4: Timeout Error
- **Expected**: Timeout error displayed after 46 seconds
- **Success Criteria**:
  - Error panel with red border and hazard stripes
  - Message: "Verification timed out after 45 seconds"
  - Instructions: "wait 30 seconds and try again"
  - "contact support" text visible
  - Retry button visible
- **Screenshots**: `scenario-4-timeout-error.png`

### Scenario 5: Database Error
- **Expected**: Database error displayed correctly
- **Success Criteria**:
  - Error message: "Database error during verification"
  - Text: "temporary issue"
  - Instructions: "wait 10 seconds and try again"
  - Retry button visible
- **Screenshots**: `scenario-5-database-error.png`

### Scenario 6: Rate Limit Error
- **Expected**: Rate limit error with countdown
- **Success Criteria**:
  - Error message: "Rate limit exceeded"
  - Instructions: "wait 60 seconds before trying again"
  - Retry button visible
- **Screenshots**: `scenario-6-rate-limit-error.png`

### Scenario 7: State Consistency
- **Expected**: State maintained after navigation away and back
- **Success Criteria**:
  - Button not stuck in loading state
  - Final state is either "VERIFIED" or "VERIFY ON BLOCKCHAIN"
  - No crashes or stuck states
- **Screenshots**: `scenario-7-state-after-navigation.png`

### Console Monitoring Test
- **Expected**: No unhandled promise rejections
- **Success Criteria**:
  - 0 unhandled promise rejections
  - 0 React hydration errors
  - 0 uncaught exceptions

### Visual Regression Tests
- **Button States**: idle → loading → success
- **Error Panel Styling**: Industrial design with hazard stripes, Orbitron font, corner accents

## Running Specific Scenarios

### Run only Scenario 3 (the critical 240 NFT test)
```bash
npx playwright test tests/large-collection-verification.spec.ts -g "Scenario 3"
```

### Run all error scenarios (4, 5, 6)
```bash
npx playwright test tests/large-collection-verification.spec.ts -g "error"
```

### Run console monitoring
```bash
npx playwright test tests/large-collection-verification.spec.ts -g "Console monitoring"
```

## Generating Baseline Screenshots (First Time)

```bash
npx playwright test tests/large-collection-verification.spec.ts --update-snapshots
```

This creates baseline screenshots in `tests/large-collection-verification.spec.ts-snapshots/`

## Viewing Test Results

### HTML Report (recommended)
```bash
npx playwright show-report
```

### Debug Mode (step-by-step)
```bash
npx playwright test tests/large-collection-verification.spec.ts --debug
```

### Headed Mode (see browser)
```bash
npx playwright test tests/large-collection-verification.spec.ts --headed
```

## Understanding Test Failures

### Test SHOULD FAIL if:

1. **Scenario 3 fails with ctx.query/ctx.db errors**
   - This means the scheduler-based fix is broken
   - Check console output for "ctx.query is undefined" or "ctx.db is undefined"
   - Fix: Verify `convex/blockchainVerification.ts` lines 286-289 use `ctx.scheduler.runAfter`

2. **Console Monitoring test fails**
   - Unhandled promise rejections detected
   - Fix: Ensure all async operations have proper error handling

3. **Scenario 7 fails (stuck loading state)**
   - Button stuck in "VERIFYING..." state after navigation
   - Fix: Check `finally` block in verification handler resets `isVerifying`

4. **Visual regression tests fail**
   - Screenshots don't match baseline
   - Acceptable if intentional UI changes were made
   - Update baselines with `--update-snapshots` if changes are correct

### Test SHOULD PASS if:

- All 240 NFTs verify successfully WITHOUT database errors
- Error messages are clear and actionable
- Button state transitions work correctly
- Console is clean (no unhandled exceptions)
- Visual styling matches industrial design system

## CI/CD Integration

### Run tests in headless mode
```bash
npx playwright test tests/large-collection-verification.spec.ts --headed=false
```

### Generate report for CI
```bash
npx playwright test tests/large-collection-verification.spec.ts --reporter=json
```

## Troubleshooting

### App not starting
- Check if port 3100 is already in use
- Run `npm run dev:all` manually
- Wait for "ready" message before running tests

### Tests timing out
- Increase timeout in test: `{ timeout: 60000 }`
- Check if Convex backend is running
- Verify network connectivity

### Visual regression failures
- Review diff images in test report
- Use `npx playwright show-report` to see visual diffs
- Update baselines if UI changes are intentional

### Rate limit errors in tests
- Tests mock backend responses (no actual API calls)
- If real rate limiting occurs, wait 60 seconds

## Expected Console Output

### Successful Test Run
```
✓ Scenario 1 completed in 7000ms
✓ Scenario 2 completed in 12000ms
✓ Scenario 3 (CRITICAL) completed in 25000ms - NO DATABASE ERRORS!
✓ FIX VALIDATED: scheduler-based mutation succeeded for 240 NFTs
✓ Scenario 4: Timeout error handled correctly
✓ Scenario 5: Database error displayed correctly
✓ Scenario 6: Rate limit error displayed correctly
✓ Scenario 7: State consistency maintained after navigation
✓ Console monitoring: No critical errors detected
✓ Visual regression: All button states captured
✓ Visual regression: Error panel styling verified

11 passed (180s)
```

## Key Metrics

- **Total test time**: ~3-5 minutes (some tests wait 46 seconds for timeout)
- **Critical test (Scenario 3)**: 20-45 seconds
- **Screenshot count**: 15-20 baseline images
- **Pass rate**: Should be 100% if fix is working

## Next Steps After Testing

1. **If all tests pass**: Fix is validated for 240+ NFT collections
2. **If Scenario 3 fails**: Scheduler-based mutation needs debugging
3. **If console tests fail**: Error handling needs improvement
4. **If visual tests fail**: Review UI changes or update baselines

## Contact

If tests fail unexpectedly, provide:
- Console output from test run
- Screenshots from `playwright-report/`
- Browser console logs during actual app usage
- Steps to reproduce the failure
