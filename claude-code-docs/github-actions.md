# Claude Code GitHub Actions

> Use Claude Code in CI/CD workflows with GitHub Actions

Integrate Claude Code into your GitHub Actions workflows to automate code reviews, generate documentation, fix failing tests, and more.

## Quick start

Add Claude Code to your GitHub Actions workflow:

```yaml
name: Claude Code Workflow
on: [push, pull_request]

jobs:
  claude-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Run Claude Code
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude "Review this code for potential issues and suggest improvements"
```

## Setup

### 1. Get an API key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Generate an API key
3. Add it to your repository secrets as `ANTHROPIC_API_KEY`

### 2. Configure authentication

Claude Code in CI requires API key authentication:

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Common use cases

### Automated code review

Review pull requests automatically:

```yaml
name: PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Get full history for diff
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude "Review the changes in this PR. Look for bugs, performance issues, and suggest improvements"
```

### Fix failing tests

Automatically fix test failures:

```yaml
name: Fix Tests
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  fix-tests:
    runs-on: ubuntu-latest
    if: failure()  # Run when tests fail
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests and capture output
        id: test
        run: npm test 2>&1 | tee test-output.txt
        continue-on-error: true
      
      - name: Fix failing tests
        if: steps.test.outcome == 'failure'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude "The tests are failing. Here's the output: $(cat test-output.txt). Please fix the failing tests."
      
      - name: Commit fixes
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add -A
          git commit -m "Fix failing tests [skip ci]" || echo "No changes to commit"
          git push
```