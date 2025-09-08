# Quickstart

> Welcome to Claude Code!

This quickstart guide will have you using AI-powered coding assistance in just a few minutes. By the end, you'll understand how to use Claude Code for common development tasks.

## Before you begin

Make sure you have:

* A terminal or command prompt open
* A code project to work with
* A [Claude.ai](https://claude.ai) (recommended) or [Anthropic Console](https://console.anthropic.com/) account

## Step 1: Install Claude Code

### NPM Install

If you have [Node.js 18 or newer installed](https://nodejs.org/en/download/):

```sh
npm install -g @anthropic-ai/claude-code
```

### Native Install

<Tip>
  Alternatively, try our new native install, now in beta.
</Tip>

**macOS, Linux, WSL:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell:**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**

```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

## Step 2: Log in to your account

Claude Code requires an account to use. When you start an interactive session with the `claude` command, you'll need to log in:

```bash
claude
# You'll be prompted to log in on first use
```

```bash
/login
# Follow the prompts to log in with your account
```

You can log in using either account type:

* [Claude.ai](https://claude.ai) (subscription plans - recommended)
* [Anthropic Console](https://console.anthropic.com/) (API access with pre-paid credits)

Once logged in, your credentials are stored and you won't need to log in again.

<Note>
  When you first authenticate Claude Code with your Anthropic Console account, a workspace called "Claude Code" is automatically created for you. This workspace provides centralized cost tracking