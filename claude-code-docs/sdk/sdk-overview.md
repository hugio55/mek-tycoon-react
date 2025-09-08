# Overview

> Build custom AI agents with the Claude Code SDK

## SDK Options

The Claude Code SDK is available in multiple forms to suit different use cases:

* **[Headless Mode](/en/docs/claude-code/sdk/sdk-headless)** - For CLI scripts and automation
* **[TypeScript SDK](/en/docs/claude-code/sdk/sdk-typescript)** - For Node.js and web applications
* **[Python SDK](/en/docs/claude-code/sdk/sdk-python)** - For Python applications and data science

## Why use the Claude Code SDK?

Built on top of the agent harness that powers Claude Code, the Claude Code SDK provides all the building blocks you need to build production-ready agents:

* **Optimized Claude integration**: Automatic prompt caching and performance optimizations
* **Rich tool ecosystem**: File operations, code execution, web search, and MCP extensibility
* **Advanced permissions**: Fine-grained control over agent capabilities
* **Production essentials**: Built-in error handling, session management, and monitoring

## What can you build with the SDK?

Here are some example agent types you can create:

**Coding agents:**

* SRE agents that diagnose and fix production issues
* Security review bots that audit code for vulnerabilities
* Oncall engineering assistants that triage incidents
* Code review agents that enforce style and best practices

**Business agents:**

* Legal assistants that review contracts and compliance
* Finance advisors that analyze reports and forecasts
* Customer support agents that resolve technical issues
* Content creation assistants for marketing teams

## Core Concepts

### Authentication

For basic authentication, retrieve an Anthropic API key from the [Anthropic Console](https://console.anthropic.com/) and set the `ANTHROPIC_API_KEY` environment variable.

The SDK also supports authentication via third-party API providers:

* **Amazon Bedrock**: Set `CLAUDE_CODE_USE_BEDROCK=1` environment variable and configure AWS credentials
* **Google Vertex AI**: Set `CLAUDE_CODE_USE_VERTEX=1` environment variable and configure Google Cloud credentials

For detailed configuration instructions for third-party providers, see the [Amazon Bedrock](/en/docs/claude-code/amazon-bedrock) and [Google Vertex AI](/en/docs/claude-code/google-vertex-ai) documentation.