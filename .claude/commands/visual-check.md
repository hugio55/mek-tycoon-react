---
name: visual-check
description: Check if visual changes are working in the browser
---

You should use the visual-test agent to verify that the visual changes are actually happening in the browser. The agent will:

1. Navigate to the application
2. Take screenshots
3. Check console for errors
4. Verify the visual change is working
5. Test interactions if needed

Activate the visual-test agent with specific instructions about what to check.

Example usage:
- "/visual-check - verify the button turned yellow"
- "/visual-check - check if the modal opens when clicked"
- "/visual-check - confirm the animation is smooth"