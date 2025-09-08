# Connect Claude Code to tools via MCP

> Extend Claude Code with Model Context Protocol servers for database access, API integrations, and more

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open protocol that enables secure, controlled interactions between AI assistants like Claude Code and external data sources or tools.

## What is MCP?

MCP provides a standardized way to connect Claude Code to:

- **Databases**: Query and analyze data from PostgreSQL, MySQL, SQLite, and more
- **Developer tools**: Access GitHub, GitLab, Jira, Linear, and other platforms
- **File systems**: Enhanced file operations beyond standard access
- **APIs**: Connect to any REST or GraphQL API
- **Cloud services**: Integrate with AWS, Google Cloud, Slack, and more

Each integration runs as a separate MCP server that Claude Code can communicate with through a secure protocol.

## Quick start

<Steps>
  <Step title="Find an MCP server">
    Browse available servers at [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) or search the [MCP directory](https://modelcontextprotocol.io/directory).
  </Step>

  <Step title="Install the server">
    Most MCP servers can be installed via npm:
    ```bash
    npm install -g @modelcontextprotocol/server-github
    ```
  </Step>

  <Step title="Configure Claude Code">
    Run the configuration command:
    ```bash
    /mcp
    ```
    Then follow the prompts to add your server configuration.
  </Step>

  <Step title="Start using the tools">
    Once configured, Claude Code automatically has access to the server's tools. Just describe what you want to do:
    
    "Search for open issues in my GitHub repository"
    "Query the users table in my PostgreSQL database"
  </Step>
</Steps>

## Example configurations

### GitHub integration

Connect to GitHub for repository management:

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "your-github-token"
    }
  }
}
```

### PostgreSQL database

Query and analyze PostgreSQL databases:

```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
  }
}
```

### Filesystem with enhanced capabilities

Advanced file operations:

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
  }
}
```