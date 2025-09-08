# Get started with Claude Code hooks

> Learn how to customize and extend Claude Code's behavior by registering shell commands

Claude Code hooks are user-defined shell commands that execute at various points
in Claude Code's lifecycle. Hooks provide deterministic control over Claude
Code's behavior, ensuring certain actions always happen rather than relying on
the LLM to choose to run them.

<Tip>
  For reference documentation on hooks, see [Hooks reference](/en/docs/claude-code/hooks).
</Tip>

Example use cases for hooks include:

* **Notifications**: Customize how you get notified when Claude Code is awaiting
  your input or permission to run something.
* **Automatic formatting**: Run `prettier` on .ts files, `gofmt` on .go files,
  etc. after every file edit.
* **Logging**: Track and count all executed commands for compliance or
  debugging.
* **Feedback**: Provide automated feedback when Claude Code produces code that
  does not follow your codebase conventions.
* **Custom permissions**: Block modifications to production files or sensitive
  directories.

By encoding these rules as hooks rather than prompting instructions, you turn
suggestions into app-level code that executes every time it is expected to run.

<Warning>
  You must consider the security implication of hooks as you add them, because hooks run automatically during the agent loop with your current environment's credentials.
  For example, malicious hooks code can exfiltrate your data. Always review your hooks implementation before registering them.

  For full security best practices, see [Security Considerations](/en/docs/claude-code/hooks#security-considerations) in the hooks reference documentation.
</Warning>

## Hook Events Overview

Claude Code provides several hook events that run at different points in the
workflow:

* **PreToolUse**: Runs before tool calls (can block them)
* **PostToolUse**: Runs after tool calls complete
* **UserPromptSubmit**: Runs when the user submits a prompt, before Claude processes it
* **Notification**: Runs when Claude Code sends notifications
* **Stop**: Runs when Claude Code finishes responding
* **SubagentStop**: Runs when subagent completes