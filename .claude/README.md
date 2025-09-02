# Claude Code Visual Testing Setup

## 🎯 Purpose
This setup enables Claude Code to visually test your application in a real browser, checking if UI changes are actually working and monitoring console for errors.

## 🚀 Quick Start

### 1. Install Playwright MCP Server
```bash
npm install -g @executeautomation/playwright-mcp-server
```

### 2. Configure Claude Desktop
Add to your Claude Desktop config file (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### 3. Restart Claude Desktop
Close and reopen Claude Desktop to load the MCP server.

## 📝 How to Use

### Visual Testing Commands
1. **Quick Check**: `/visual-check - verify the button color changed`
2. **Detailed Test**: `@visual-test check if modal opens correctly`

### What It Can Do
- ✅ Take screenshots of your app
- ✅ Check browser console for errors
- ✅ Click buttons and verify results
- ✅ Test hover states and animations
- ✅ Verify responsive design at different sizes
- ✅ Confirm visual changes are actually happening

## 🔧 Available Agents

### visual-test
- **Purpose**: Verify visual changes in browser
- **Trigger**: `@visual-test` or via `/visual-check` command
- **Capabilities**: Screenshots, console monitoring, interaction testing

### design-review
- **Purpose**: Comprehensive UI/UX review
- **Trigger**: `@design-review` for full design audit
- **Capabilities**: Full accessibility testing, responsive design check, visual consistency

## 📁 Project Structure
```
.claude/
├── agents/
│   ├── visual-test.md      # Visual testing agent
│   └── design-review.md    # Design review agent
├── commands/
│   └── visual-check.md     # Quick visual check command
├── settings.json           # MCP and agent configuration
└── README.md              # This file
```

## 💡 Example Scenarios

### Testing a Color Change
```
User: "Change the save button to green"
Claude: [makes the change]
User: "/visual-check - verify save button is green"
Claude: [uses Playwright to screenshot and confirm]
```

### Testing an Interaction
```
User: "Make sure the modal opens when clicked"
User: "@visual-test verify modal functionality"
Claude: [navigates to page, clicks button, verifies modal appears]
```

### Checking for Errors
```
User: "Is there any console error on the talent builder page?"
User: "/visual-check - check console on talent builder"
Claude: [navigates to page, checks console, reports findings]
```

## 🛠️ Troubleshooting

### MCP Server Not Found
- Make sure you've installed: `npm install -g @executeautomation/playwright-mcp-server`
- Restart Claude Desktop after config changes

### Browser Not Opening
- Ensure your dev server is running (`npm run dev:all`)
- Default URL is `http://localhost:3100`

### Commands Not Working
- Commands require Claude Desktop (not web version)
- MCP servers must be configured in Claude Desktop settings

## 📚 Resources
- [Playwright MCP Documentation](https://github.com/microsoft/playwright-mcp)
- [Claude Code Workflows](https://github.com/patrickoakley/claude-code-workflows)