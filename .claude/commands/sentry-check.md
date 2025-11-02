---
name: sentry-check
description: Check Sentry for new errors and provide intelligent diagnosis
---

## Instructions

1. **Fetch unresolved issues** from the last 48 hours using `mcp__sentry__search_issues`

2. **Auto-filter known noise** - Ignore these patterns:
   - Issues with "SentryExample" in the title (test/demo errors)
   - Issues on `/sentry-example-page` route
   - EPIPE broken pipe errors in Next.js dev server logging
   - Any other issues explicitly marked as "harmless" in project docs

3. **For each REAL issue, get detailed information** using `mcp__sentry__get_issue_details`

4. **Diagnose and categorize** each issue:
   - 🔴 **CRITICAL**: Breaks core game functionality (gold collection, crafting, save system, etc.)
   - 🟡 **MEDIUM**: Breaks minor feature or admin page
   - 🟢 **LOW**: Cosmetic, logging errors, or recoverable issues
   - ⚪ **HARMLESS**: Can be safely ignored or auto-resolved

5. **For each issue, provide:**
   - Severity level (emoji + category)
   - What broke (plain English description)
   - Where it broke (file path + line number if available)
   - Likely cause
   - Recommended action: "Fix immediately", "Fix when convenient", "Ignore", or "Auto-resolve"

6. **Create todos** for any issues that need fixing (CRITICAL or MEDIUM severity)

7. **Offer to auto-resolve** harmless issues with user approval

8. **Summary output format:**
   ```
   Sentry Check Results (Last 48 Hours)
   =====================================

   🔴 CRITICAL (X issues):
   - [Issue details...]

   🟡 MEDIUM (X issues):
   - [Issue details...]

   🟢 LOW (X issues):
   - [Issue details...]

   ⚪ HARMLESS (X issues):
   - [Issue details...]

   ✅ Next Steps:
   - [Created todos for issues needing fixes]
   - [Offer to resolve harmless issues]
   ```

9. **If no real issues found**, simply report: "✅ No new issues in Sentry (last 48 hours)"

## Notes
- Be concise but informative
- Focus on actionable information
- Don't overwhelm with stack traces unless asked
- Prioritize user's time - highlight what actually matters
