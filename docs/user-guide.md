# JPA CLI User Guide

This guide provides an in-depth look at configuring, executing, and troubleshooting the JPA Command Line Interface tool (`jpa-cli`).

---

## Configuration Storage & Security

JPA CLI stores credentials and user configurations globally on your local machine to preserve authentication state across different workspaces.

### 1. Configuration File Paths
- **Windows**: `C:\Users\<YourUsername>\.config\jpa-cli\config.json`
- **macOS / Linux**: `~/.config/jpa-cli/config.json`

### 2. Configuration JSON Schema
The configuration file is formatted in standard JSON and houses credentials for JPA CLI as well as external LLM providers:
```json
{
  "apiKey": "jago_api_token_here",
  "geminiApiKey": "gemini_api_token_here",
  "openrouterApiKey": "openrouter_api_token_here",
  "groqApiKey": "groq_api_token_here"
}
```

### 3. File Permissions
To prevent local token sniffing:
- On Unix-like systems (macOS, Linux), the configuration file is created with restricted read/write permissions (`0o600` or `-rw-------`). 
- On Windows, standard ACL restrictions protect user profile config folders.

---

## Detailed Commands Workflow

When executing `jpa-cli` without parameters, an interactive terminal dashboard menu is launched. You can also run commands directly with flags and arguments:

### 1. `login` (JPA CLI Key Setup)
Authenticates your terminal with the JPA CLI backend API.
```bash
jpa-cli login
```
- Prompt hides input characters during entry for maximum safety.
- Validates token against the JPA CLI endpoint and saves it on success.

### 2. `keys [provider] [key]` (Multi-Provider Key Manager)
Configures LLM provider credentials used by local agents (e.g. Cline, Claude Code, etc.) to access Gemini, Groq, or OpenRouter.
```bash
# Launch the interactive configuration wizard
jpa-cli keys

# Or set provider keys directly:
jpa-cli keys gemini <api-key>
```
- Interactive wizard lets you view current credentials (masked for privacy), update them, or purge them.

### 3. `detect` (Workspace Scanner)
Scans the current workspace directory to identify configuration environments.
```bash
jpa-cli detect
```
Analyzes the workspace root recursively for:
- Git configuration (`.git`).
- Active rule files (`.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`).
- Project stack indicators (`package.json` for Node, `composer.json` for Laravel/PHP, `Cargo.toml` for Rust, etc.).
- Active LLM keys status in the system config.

### 4. `init` (Project Bootstrapper & PRD Generator)
Generates developer workspaces and AI agent rule files matching your goals.
```bash
jpa-cli init
```
- Checks system paths for installed AI coding agents (Claude Code, Antigravity, Cline, Kilo, etc.).
- Interactively gathers project info (stack, target language, goals, workflow methodology like TDD or Feature-Driven).
- Assembles and outputs optimized `.cursorrules`, `.claudecoderc`, or `.github/copilot-instructions.md` containing customized programming directives.
- Prompts you to sync a remote skill rule directly.
- Creates a structured `PRD.md` (Product Requirements Document) template inside your root directory.

### 5. `skills` (Catalog Explorer)
Lists all local and registered community skill instruction profiles and audits if they are synchronized with the active rule files in the current workspace.
```bash
jpa-cli skills
```

### 6. `sync [skill-name]` (Rules Synchronizer)
Downloads rules from JPA CLI API and writes them into target files.
```bash
jpa-cli sync typescript-esm
```
- Pulls instruction sets from the remote registry.
- If multiple rule files are detected (e.g. both Cursor and Claude Code configurations), it prompts you to select one or more write targets.
- Merges code instructions and overwrites existing rules safely.

### 7. `mcp [install-name]` (Model Context Protocol Installer)
Catalogues and configures recommended Model Context Protocol (MCP) servers locally.
```bash
# Open interactive catalog
jpa-cli mcp

# Install specific server directly
jpa-cli mcp sqlite
```
- Reads configurations dynamically from the dynamic templates inside `mcp/`.
- Guides user inputs for required variables (like database paths or API Keys).
- Automatically registers the server definition inside the Claude Code config file (`~/.claudecode/config.json`).

---

## Troubleshooting Scenarios

### 1. Connection Errors / API Reachability
If the CLI reports HTTP errors during `sync` or `login`:
- Verify internet connectivity.
- Check if `https://jpa.my.id/` is accessible in your browser.
- If behind a proxy, set your system proxy environment variables:
  - Windows: `$env:HTTP_PROXY="http://yourproxy:port"`
  - macOS/Linux: `export HTTP_PROXY="http://yourproxy:port"`

### 2. "Authentication Required" or "Invalid API Key"
If requests are rejected with a 401 Unauthorized code:
- Run `jpa-cli login` to update your main API token.
- Validate that the token does not contain trailing spaces or incorrect characters.

### 3. Permission Errors / Write Faults
If the CLI fails to write rules to `.cursorrules` or `.claudecoderc`:
- Confirm you have write permissions in the target folder.
- On Windows, ensure your shell is not running under constrained sandbox settings that block file modifications.
