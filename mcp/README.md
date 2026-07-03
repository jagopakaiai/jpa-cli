# JagoPakaiAI Model Context Protocol (MCP) Setup Guide

This directory contains documentation and templates for configuring recommended MCP servers.
MCP allows JagoPakaiAI and other AI coding assistants (like Claude Code) to securely connect to external tools, databases, and APIs.

## Recommended MCP Servers

1. **sqlite**: SQLite database inspection and operations tool.
2. **postgres**: Postgres database connection and explorer tool.
3. **filesystem**: Provides controlled local filesystem access to AI agents.
4. **fetch**: Fetches web content and converts HTML to markdown.
5. **github**: Enables repository, pull requests, and issues automation.
6. **memory**: Graph-based knowledge indexing and semantic storage.
7. **brave-search**: Brave Search engine API integration for web search capabilities.
8. **gmail**: Gmail integration allowing reading, drafting, and sending emails.
9. **gcalendar**: Google Calendar integration for scheduling and event tracking.
10. **docker**: Manage and inspect local Docker containers and images.

## How to Install and Configure

You can install these MCP servers automatically using the JagoPakaiAI CLI:
```bash
jpa-cli mcp
```
Or choose a specific server to install directly:
```bash
jpa-cli mcp <server-name>
```

Alternatively, you can copy the contents of `config-template.json` in this directory into your Claude Code config file (`~/.claudecode/config.json`).

For more details on MCP, visit: https://modelcontextprotocol.io