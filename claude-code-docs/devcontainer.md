# Development containers

> Learn about the Claude Code development container for teams that need consistent, secure environments.

The reference [devcontainer setup](https://github.com/anthropics/claude-code/tree/main/.devcontainer) and associated [Dockerfile](https://github.com/anthropics/claude-code/blob/main/.devcontainer/Dockerfile) offer a preconfigured development container that you can use as is, or customize for your needs. This devcontainer works with the Visual Studio Code [Dev Containers extension](https://code.visualstudio.com/docs/devcontainers/containers) and similar tools.

The container's enhanced security measures (isolation and firewall rules) allow you to run `claude --dangerously-skip-permissions` to bypass permission prompts for unattended operation.

<Warning>
  While the devcontainer provides substantial protections, no system is completely immune to all attacks.
  When executed with `--dangerously-skip-permissions`, devcontainers do not prevent a malicious project from exfiltrating anything accessible in the devcontainer including Claude Code credentials.
  We recommend only using devcontainers when developing with trusted repositories.
  Always maintain good security practices and monitor Claude's activities.
</Warning>

## Key features

* **Production-ready Node.js**: Built on Node.js 20 with essential development dependencies
* **Security by design**: Custom firewall restricting network access to only necessary services
* **Developer-friendly tools**: Includes git, ZSH with productivity enhancements, fzf, and more
* **Seamless VS Code integration**: Pre-configured extensions and optimized settings
* **Session persistence**: Preserves command history and configurations between container restarts
* **Works everywhere**: Compatible with macOS, Windows, and Linux development environments

## Getting started in 4 steps

1. Install VS Code and the Remote - Containers extension
2. Clone the [Claude Code reference implementation](https://github.com/anthropics/claude-code/tree/main/.devcontainer) repository
3. Open the repository in VS Code
4. When prompted, click "Reopen in Container" (or use Command Palette: Cmd+Shift+P)