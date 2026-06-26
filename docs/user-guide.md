# JagoPakaiAI CLI User Guide

This guide provides an in-depth look at using, configuring, and troubleshooting the JagoPakaiAI Command Line Interface tool (`jagopakaiai-cli`).

---

## Configuration Location

JagoPakaiAI CLI stores user configurations globally to maintain your login session across multiple project workspaces.

- **Windows**: `C:\Users\<YourUsername>\.config\jagopakaiai-cli\config.json`
- **macOS / Linux**: `~/.config/jagopakaiai-cli/config.json`

### File Format
The file is structured as a basic JSON payload:
```json
{
  "apiKey": "your-api-key-here"
}
```

> **Security Note:** On Unix-like platforms (macOS/Linux), the CLI creates this file with restrictive read/write permissions (`0o600` or `-rw-------`) so other local users cannot inspect your token.

---

## Detailed Commands Workflow

### 1. Authentication (`login`)
To communicate with the JagoPakaiAI API, you must activate the CLI session.
```bash
jagopakaiai-cli login
```
1. The terminal will obscure your input for safety while you type or paste your key.
2. If the API key is valid, it writes to the global path.
3. You can override an existing session at any time by running the command again.

### 2. Multi-Provider AI Keys Management (`keys`)
To set up keys for external AI providers (Gemini, OpenRouter, Groq) or JagoPakaiAI:
```bash
# Interactively configure provider keys
jagopakaiai-cli keys

# Directly configure a specific key
jagopakaiai-cli keys groq <api-key>
```
1. Run without arguments to launch an interactive selection and configuration wizard.
2. Direct CLI invocation writes/updates the key for the provider instantly.
3. Allows verifying and deleting configured keys.

### 3. Workspace Diagnostics (`detect`)
Use this command to audit a newly cloned repository or check configuration status.
```bash
jagopakaiai-cli detect
```
This command performs light scanning at the root directory of your workspace:
- `.git`: Confirms if the directory is a Git repository.
- `.cursorrules`: Indicates the workspace is ready for Cursor.
- `.claudecoderc` or `.claudecode/`: Indicates the workspace is set up for Claude Code.
- `.github/copilot-instructions.md`: Indicates the workspace supports GitHub Copilot instructions.
- Checks files like `package.json`, `composer.json`, `Cargo.toml`, etc., to log the runtime stack context.
- Prints the status of each configured API key (JagoPakaiAI, Gemini, OpenRouter, Groq).

### 4. Fetching Instructions (`sync`)
To fetch AI rules for your workspace:
```bash
jagopakaiai-cli sync [skill-name]
```
If you omit the `[skill-name]` argument, the CLI will prompt you to enter it interactively.

#### Behavior when multiple environments are detected:
If the workspace has both `.cursorrules` and `.claudecoderc` active, the CLI will present a multi-select prompt:
```text
Select AI rule configs to write to:
[ ] Cursor Rules (.cursorrules)
[ ] Claude Code (.claudecoderc)
[ ] GitHub Copilot (.github/copilot-instructions.md)
```
Use the arrow keys and Spacebar to toggle targets, then press Enter to execute.

---

## Troubleshooting

### 1. Connection Failures
If you receive a connection error during synchronization:
- Ensure you have active internet access.
- Verify the JagoPakaiAI API is reachable at `https://jagopakaiai.my.id/`.
- Ensure no corporate proxies are blocking standard HTTP requests.

### 2. "Authentication Required"
If sync commands abort with an auth error, run:
```bash
jagopakaiai-cli login
```
to re-apply your API credentials.
