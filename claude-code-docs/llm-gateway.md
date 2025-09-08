# LLM gateway configuration

> Learn how to configure Claude Code with LLM gateway solutions, including LiteLLM setup, authentication methods, and enterprise features like usage tracking and budget management.

LLM gateways provide a centralized proxy layer between Claude Code and model providers, offering:

* **Centralized authentication** - Single point for API key management
* **Usage tracking** - Monitor usage across teams and projects
* **Cost controls** - Implement budgets and rate limits
* **Audit logging** - Track all model interactions for compliance
* **Model routing** - Switch between providers without code changes

## LiteLLM configuration

<Note>
  LiteLLM is a third-party proxy service. Anthropic doesn't endorse, maintain, or audit LiteLLM's security or functionality. This guide is provided for informational purposes and may become outdated. Use at your own discretion.
</Note>

### Prerequisites

* Claude Code updated to the latest version
* LiteLLM Proxy Server deployed and accessible
* Access to Claude models through your chosen provider

### Basic LiteLLM setup

**Configure Claude Code**:

#### Authentication methods

##### Static API key

Simplest method using a fixed API key:

```bash
# Set in environment
export ANTHROPIC_AUTH_TOKEN=sk-litellm-static-key

# Or in Claude Code settings
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key"
  }
}
```

This value will be sent as the `Authorization` header.

##### Dynamic API key with helper

For rotating keys or per-user authentication:

1. Create an API key helper script:

```bash
#!/bin/bash
# ~/bin/get-litellm-key.sh

# Example: Fetch key from vault
vault kv get -field=api_key secret/litellm/claude-code

# Example: Generate JWT token
jwt encode \
  --secret="${JWT_SECRET}" \
  --exp="+1h" \
  '{"user":"'${USER}'","team":"engineering"}'
```

2. Configure Claude Code settings