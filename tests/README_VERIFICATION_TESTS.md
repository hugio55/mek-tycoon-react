# Blockfrost Verification Visual Testing Suite

**Test Coverage:** Error handling, loading states, button transitions, console monitoring
**Component Under Test:** BlockchainVerificationPanel
**Test Files:**
- Automated: `tests/verification-error-handling.spec.ts`
- Manual Checklist: `tests/VERIFICATION_VISUAL_CHECKLIST.md`

---

## Quick Start

### 1. Prerequisites

```bash
# Ensure app is running
npm run dev:all

# App should be accessible at:
# http://localhost:3100
```

### 2. Run Automated Tests

```bash
# Run all verification tests
npx playwright test tests/verification-error-handling.spec.ts

# Run specific test
npx playwright test tests/verification-error-handling.spec.ts -g "large collection"

# Run in headed mode (see browser)
npx playwright test tests/verification-error-handling.spec.ts --headed

# Run with debug mode
npx playwright test tests/verification-error-handling.spec.ts --debug
```

### 3. Generate Visual Baselines

**First time only** - Create baseline screenshots:

```bash
npx playwright test tests/verification-error-handling.spec.ts --update-snapshots
```

This creates reference images in:
```
tests/verification-error-handling.spec.ts-snapshots/
├── verification-loading-large-collection-chromium.png
├── verification-success-large-collection-chromium.png
├── verification-timeout-error-chromium.png
├── verification-ctx-query-error-chromium.png
├── verification-rate-limit-error-chromium.png
├── button-state-idle-chromium.png
├── button-state-loading-chromium.png
├── button-state-error-chromium.png
├── button-state-success-chromium.png
├── verification-success-complete-chromium.png
├── verification-success-console-clean-chromium.png
└── error-panel-industrial-styling-chromium.png
```

### 4. View Test Results

```bash
# Open HTML report
npx playwright show-report

# View specific test report
npx playwright show-report playwright-report
```

### 5. Manual Testing

Follow the checklist in `tests/VERIFICATION_VISUAL_CHECKLIST.md`:
- Print or open on second monitor
- Work through each test scenario
- Check off completed items
- Document issues found

---

## Test Scenarios Covered

### Automated Tests (Playwright)

1. **Large Collection Loading (240+ NFTs)**
   - Loading states and progress indicators
   - "Large collection" warning message
   - Timeout handling (45+ seconds)
   - Success state after verification

2. **Timeout Error Handling**
   - Error panel appears with industrial styling
   - Hazard stripe header and decorative corners
   - Clear error message with actionable steps
   - Retry functionality

3. **"ctx.query undefined" Error**
   - Database error handling
   - Error toast/panel display
   - User-friendly error message
   - Error button styling (red with hazard stripes)

4. **Rate Limit Error**
   - Rate limit detection
   - Countdown timer display
   - Retry after cooldown period

5. **Button State Transitions**
   - Idle → Loading → Error → Idle (retry)
   - Idle → Loading → Success
   - No "stuck" loading states
   - Proper state cleanup

6. **Console Error Monitoring**
   - No unhandled promise rejections during success
   - Errors properly logged during failures
   - Error propagation from backend to UI
   - No console pollution

7. **Industrial Design Compliance**
   - Hazard stripes visible
   - Orbitron font on headers
   - Corner accents on error panels
   - Proper color scheme (yellow/red/green)

8. **Error Message Clarity**
   - Timeout: Clear explanation with wait time
   - Database: User-friendly with suggested action
   - Rate limit: Specific cooldown time
   - Network: Connection check reminder

### Manual Tests (Visual Checklist)

1. **Animation Performance**
   - Smooth spinner animations (60fps)
   - No layout shifts
   - Progress bar updates smoothly

2. **Cross-Browser Compatibility**
   - Chrome, Firefox, Safari
   - Consistent rendering
   - Font loading
   - Backdrop blur support

3. **Mobile Responsiveness**
   - Button text truncation
   - Touch target sizes (48px minimum)
   - Vertical button stacking
   - Readable text sizes

4. **Accessibility**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader announcements
   - Focus indicators

5. **Network Performance**
   - Rate limiting works
   - Cache utilization (5min TTL)
   - Timeout enforcement (45s)
   - Koios fallback

---

## Understanding Test Output

### Passing Test
```
✓ should display loading states for large collection (240+ NFTs) (15s)
```

### Failing Test with Visual Diff
```
✗ should display loading states for large collection (240+ NFTs) (15s)

  Error: Screenshot comparison failed:

  Expected: verification-loading-large-collection-chromium.png
  Received: verification-loading-large-collection-actual.png
  Diff: verification-loading-large-collection-diff.png

  123 pixels (0.05% of 1280x720) are different
```

**What to do:**
1. Open the HTML report: `npx playwright show-report`
2. View the visual diff image (red highlights show differences)
3. Determine if change is:
   - **Expected** (intentional UI change) → Update baseline
   - **Unexpected** (regression) → Fix the code

### Updating Baselines After Intentional Changes

**ONLY update baselines if the visual change was intentional:**

```bash
# Update all baselines
npx playwright test tests/verification-error-handling.spec.ts --update-snapshots

# Update specific test baseline
npx playwright test tests/verification-error-handling.spec.ts -g "timeout error" --update-snapshots
```

**Critical Rule:** Only update baselines AFTER all tests pass with the new intentional changes.

---

## Debugging Failed Tests

### 1. Run in Debug Mode

```bash
npx playwright test tests/verification-error-handling.spec.ts --debug
```

This opens Playwright Inspector:
- Step through test line by line
- Inspect page elements
- View console logs
- See network requests

### 2. View Browser Console

Add `--headed` flag to see browser window:

```bash
npx playwright test tests/verification-error-handling.spec.ts --headed --slowmo=1000
```

Check browser DevTools console (F12) for:
- JavaScript errors
- Network failures
- React warnings
- State issues

### 3. Increase Timeout

If tests fail due to slow performance:

```typescript
// In test file, increase timeout
test('should handle timeout error', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... rest of test
});
```

### 4. Check Mock Setup

Verify mocks are configured correctly:

```typescript
// Add console.logs to verify mocks
console.log('Mock wallet connected:', window.mockWalletConnected);
console.log('Mock MEKs count:', window.mockMeks.length);
```

### 5. Screenshot Current State

Take manual screenshot for debugging:

```typescript
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
```

---

## Test Maintenance

### When to Update Tests

1. **UI Changes**: Update screenshots when design changes intentionally
2. **New Features**: Add new test cases for new verification scenarios
3. **Bug Fixes**: Add regression tests for fixed bugs
4. **Error Messages**: Update assertions when error text changes

### Baseline Management

**Golden Rule:** Commit baseline screenshots to version control

```bash
git add tests/verification-error-handling.spec.ts-snapshots/
git commit -m "Update verification test baselines after industrial redesign"
```

**Why?** So CI/CD can detect visual regressions across all environments.

### CI/CD Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Run Playwright Tests
  run: npx playwright test tests/verification-error-handling.spec.ts

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Common Issues & Solutions

### Issue: "Timeout waiting for element"

**Solution:** Increase timeout or check if element selector changed

```typescript
await expect(verifyButton).toBeVisible({ timeout: 30000 }); // 30s
```

### Issue: "Screenshot comparison failed" (minor pixel differences)

**Solution:** Adjust threshold in test

```typescript
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixelRatio: 0.05 // Allow 5% difference
});
```

### Issue: "Animation causes flakiness"

**Solution:** Disable animations

```typescript
await expect(element).toHaveScreenshot({
  animations: 'disabled' // Disables CSS animations
});
```

### Issue: "Test passes locally but fails in CI"

**Solution:** Use consistent Docker container

```bash
# Run in Docker matching CI environment
npx playwright test --config=playwright.config.ci.ts
```

### Issue: "Page not ready when test starts"

**Solution:** Add robust wait conditions

```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-convex-ready]', { timeout: 10000 });
```

---

## Test Coverage Metrics

### Current Coverage

- **Button States:** 5/5 states covered (Idle, Loading, Error, Success, Retry)
- **Error Types:** 4/4 covered (Timeout, Database, Rate Limit, Network)
- **Loading States:** 7/7 progress messages covered
- **Visual Elements:** 12 screenshot baselines captured
- **Console Monitoring:** Success and failure scenarios covered

### Coverage Gaps (Future Tests)

- [ ] Multiple concurrent verification attempts
- [ ] Verification during network interruption
- [ ] Verification with malformed wallet address
- [ ] Edge case: 0 MEKs in wallet
- [ ] Edge case: 1000+ MEKs (stress test)
- [ ] Koios fallback scenario (Blockfrost down)
- [ ] Cache invalidation after 5 minutes

---

## Best Practices

### 1. Test One Thing at a Time
Each test should verify a single behavior or visual state.

### 2. Use Descriptive Test Names
```typescript
// Good
test('should display timeout error after 45 seconds with retry button')

// Bad
test('test error handling')
```

### 3. Mask Dynamic Content
Elements that change every run should be masked:

```typescript
await expect(page).toHaveScreenshot({
  mask: [
    page.locator('.timestamp'),
    page.locator('.wallet-address'),
    page.locator('.animate-ping')
  ]
});
```

### 4. Group Related Tests
```typescript
test.describe('Button State Transitions', () => {
  test('idle to loading', ...);
  test('loading to success', ...);
  test('loading to error', ...);
});
```

### 5. Clean Up After Tests
```typescript
test.afterEach(async ({ page }) => {
  // Clear mocks
  await page.evaluate(() => {
    delete window.mockWalletConnected;
    delete window.mockMeks;
  });
});
```

---

## Resources

### Documentation
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)

### Tools
- [Playwright Inspector](https://playwright.dev/docs/debug#playwright-inspector)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Codegen](https://playwright.dev/docs/codegen) - Generate test code

### Community
- [Playwright Discord](https://aka.ms/playwright/discord)
- [GitHub Discussions](https://github.com/microsoft/playwright/discussions)

---

## Support

**Issues with tests?**
1. Check this README first
2. Review test output in HTML report
3. Run tests in debug mode
4. Check console for errors
5. Compare screenshots manually

**Need help?**
- Review `VERIFICATION_VISUAL_CHECKLIST.md` for manual testing steps
- Check Playwright documentation for advanced features
- Ask in team chat with screenshot/error message

---

**Last Updated:** 2025-10-08
**Test Suite Version:** 1.0
**Maintained By:** Visual Testing Specialist Agent
