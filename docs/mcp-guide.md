# JPA CLI - Model Context Protocol (MCP) Guide

This guide describes how the JPA CLI integrates with and configures Model Context Protocol (MCP) servers for your AI coding assistants (like Claude Code, Cursor, Cline, etc.).

---

## What is the Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard designed to enable AI models to interact with local development environments, databases, external APIs, and tools securely. By registering an MCP server, you grant your AI coding agents the ability to run specific tools (e.g. executing SQL queries, reading git history, calling search APIs).

---

## Dynamic MCP Configuration Catalog

JPA CLI maintains a library of over 130+ pre-scraped and configured MCP servers in the `mcp/` directory. Each server definition contains:
- `README.md`: Explaining the tools provided, dependencies, and parameters.
- `config.json`: Specifying the execution command, default arguments, and environment variables.

### Key Recommended Servers:

1. **`sqlite`** (Database)
   - **Command**: `npx -y @modelcontextprotocol/server-sqlite`
   - **Arguments**: `--db <path-to-db>`
   - **Tools**: Allows reading schemas, executing SELECT/INSERT/UPDATE queries, and indexing databases.

2. **`postgres`** (Database)
   - **Command**: `npx -y @modelcontextprotocol/server-postgres`
   - **Arguments**: `<postgresql-connection-string>`
   - **Tools**: Introspects tables, schemas, and runs database statements.

3. **`filesystem`** (Utility)
   - **Command**: `npx -y @modelcontextprotocol/server-filesystem`
   - **Arguments**: `<allowed-directory-path>`
   - **Tools**: Grants read/write access to specified directories.

4. **`brave-search`** (Information Retrieval)
   - **Command**: `npx -y @modelcontextprotocol/server-brave-search`
   - **Environment**: `BRAVE_API_KEY`
   - **Tools**: Performs web searches directly within agent contexts.

5. **`github`** (VCS & Collaboration)
   - **Command**: `npx -y @modelcontextprotocol/server-github`
   - **Environment**: `GITHUB_PERSONAL_ACCESS_TOKEN`
   - **Tools**: Read issues, inspect repository commits, create pull requests, and search code.

6. **`upstash-context7`** (Documentation Search)
   - **Command**: `npx -y @upstash/context7-mcp`
   - **Tools**: Fetches up-to-date, version-specific package documentation (like Next.js 14, Tailwind, Supabase) straight to the AI's prompt.

---

## Interactive Installation Process

When you run the command:
```bash
jpa-cli mcp
```
The CLI executes the following steps:
1. **Catalog Parsing**: Scans the `mcp/` assets directory dynamically, loading the `config.json` configuration blocks.
2. **Interactive Selection**: Prompts the user to pick an MCP server from the list.
3. **Variable Customization**: Detects if the chosen server requires special inputs (like DB path for SQLite, token for GitHub, or allowed folder for Filesystem) and prompts you to enter them.
4. **Global Package Pre-installation**: Attempts to run `npm install -g <package>` to speed up execution and cache the binaries.
5. **Config Registration**: Reads the global Claude Code configuration (`~/.claudecode/config.json`), registers the new server configuration, and writes it back securely.

---

## Manual MCP Configuration Registration

If you prefer to configure MCP servers manually in your client (like Cline or cursor settings), you can find the complete configuration definitions for all ~130 servers inside the `mcp/` directory.

Each config has the structure:
```json
{
  "name": "example-server",
  "displayName": "Example",
  "description": "Short description",
  "mcpConfig": {
    "command": "npx",
    "args": [
      "-y",
      "example-package"
    ],
    "env": {}
  }
}
```
You can drop the `mcpConfig` block directly into your `.claudecode/config.json` or equivalent agent tool settings.
