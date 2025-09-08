# Headless mode

> Run Claude Code programmatically without interactive UI

## Overview

The headless mode allows you to run Claude Code programmatically from command line scripts and automation tools without any interactive UI.

## Basic usage

The primary command-line interface to Claude Code is the `claude` command. Use the `--print` (or `-p`) flag to run in non-interactive mode and print the final result:

```bash
claude -p "Stage my changes and write a set of commits for them" \
  --allowedTools "Bash,Read" \
  --permission-mode acceptEdits \
  --cwd /path/to/project
```

## Configuration Options

The SDK leverages all the CLI options available in Claude Code. Here are the key ones for SDK usage:

| Flag                       | Description                                                                                            | Example                                                                                                                   |
| :------------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `--print`, `-p`            | Run in non-interactive mode                                                                            | `claude -p "query"`                                                                                                       |
| `--output-format`          | Specify output format (`text`, `json`, `stream-json`)                                                  | `claude -p --output-format json`                                                                                          |
| `--resume`, `-r`           | Resume a conversation by session ID                                                                    | `claude --resume abc123`                                                                                                  |
| `--continue`, `-c`         | Continue the most recent conversation                                                                  | `claude --continue`                                                                                                       |
| `--verbose`                | Enable verbose logging                                                                                 | `claude --verbose`                                                                                                        |
| `--append-system-prompt`   | Append to system prompt (only with `--print`)                                                          | `claude --append-system-prompt "Custom instruction"`                                                                      |
| `--allowedTools`           | Space-separated list of allowed tools, or <br /><br /> string of comma-separated list of allowed tools | `claude --allowedTools "Bash,Read"`                                                                                      |