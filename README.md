# JPA CLI (`jpa-cli`)

[![npm version](https://img.shields.io/npm/v/@jagopakaiai/jpa-cli?style=flat-square&color=brightgreen)](https://www.npmjs.com/package/@jagopakaiai/jpa-cli)
[![npm downloads](https://img.shields.io/npm/dm/@jagopakaiai/jpa-cli?style=flat-square&color=brightgreen)](https://www.npmjs.com/package/@jagopakaiai/jpa-cli)
[![GitHub Release](https://img.shields.io/github/v/release/jagopakaiai/jpa-cli?style=flat-square)](https://github.com/jagopakaiai/jpa-cli/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/jagopakaiai/jpa-cli/release.yml?style=flat-square)](https://github.com/jagopakaiai/jpa-cli/actions)
[![License](https://img.shields.io/github/license/jagopakaiai/jpa-cli?style=flat-square)](LICENSE)
[![node version](https://img.shields.io/node/v/@jagopakaiai/jpa-cli?style=flat-square)](https://www.npmjs.com/package/@jagopakaiai/jpa-cli)
[![GitHub stars](https://img.shields.io/github/stars/jagopakaiai/jpa-cli?style=flat-square)](https://github.com/jagopakaiai/jpa-cli/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/jagopakaiai/jpa-cli?style=flat-square)](https://github.com/jagopakaiai/jpa-cli/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/jagopakaiai/jpa-cli?style=flat-square)](https://github.com/jagopakaiai/jpa-cli/pulls)

**JPA CLI** is a Command Line Interface utility designed to automatically detect, manage, and synchronize local AI Agent and Editor rule configurations (such as `.cursorrules`, `.claudecoderc`, and `.github/copilot-instructions.md`) directly in your workspace.

Synchronize custom and community-developed developer instructions (skills) directly from the JPA CLI API, configure multi-provider AI keys, and automatically set up pre-packaged Model Context Protocol (MCP) servers locally to optimize your AI pair programming experience.

---

## Features

- **Interactive Prompts**: Clean, structured prompts, spin indicators, and selection menus powered by `@clack/prompts`.
- **Auto-Environment Auditing**: Intelligently scans the current workspace for Git repositories, active AI/Editor configuration files, and project stack languages (Node.js, Laravel/PHP, Python, Rust, Go).
- **Multi-Target Synchronization**: Sync single skill configurations to one or more rules files simultaneously (`.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`).
- **Recommended MCP Directory**: Dynamic loading and installation of over 130+ pre-scraped and curated MCP server configurations (including `sqlite`, `postgres`, `filesystem`, `brave-search`, `gcalendar`, `gmail`, `docker`, and `upstash-context7`).
- **AI Provider Keys Manager**: Securely stores and manages API credentials locally for multiple AI providers (Gemini, OpenRouter, Groq, and JPA CLI) inside your user profile.
- **Project Initializer & PRD Generator**: Seamlessly scaffolds new projects, detects active AI environments, configures local agent rules, and creates a tailored `PRD.md` (Product Requirements Document).
- **Secure Local Config**: Saves configuration files with restrictive file permissions (`0o600` on Unix-like systems) to prevent unauthorized token reading.
- **Zero-Dependency Native Binaries**: Fully compiled standalone binaries packaged for Windows (x64), macOS (Intel/Apple Silicon), and Linux (x64).

---

## Project Directory Structure

```text
jpa-cli/
├── .github/
│   └── workflows/
│       └── release.yml       # Release & cross-compilation GitHub Actions pipeline
├── bin/                      # Compiled native executables (gitignored)
├── dist/                     # Compiled JS bundle (gitignored)
├── docs/                     # Documentation folder
│   ├── api-guide.md          # API Integration & payload guide
│   ├── user-guide.md         # Advanced usage & configuration guide
│   ├── mcp-guide.md          # Curated MCP configurations reference manual
│   └── architecture.md       # CLI system design & file resolver architecture
├── mcp/                      # Over 130+ dynamic MCP configuration & documentation templates
│   ├── upstash-context7/     # Example: Context7 MCP template (README.md & config.json)
│   ├── sqlite/               # Example: SQLite MCP template
│   └── ...
├── skills/                   # Static rules and instruction templates
├── src/                      # TypeScript source code
│   ├── commands/             # CLI commander actions
│   │   ├── detect.ts         # 'detect' environment action
│   │   ├── init.ts           # 'init' project setup & PRD generator action
│   │   ├── keys.ts           # 'keys' AI provider credential manager action
│   │   ├── mcp.ts            # 'mcp' catalog and installation wizard action
│   │   ├── skills.ts         # 'skills' listing & sync-check action
│   │   └── sync.ts           # 'sync' API rules synchronization action
│   │   index.ts              # Commander routing entrypoint & main menu
│   └── utils/                # Utility helpers
│       ├── api.ts            # JPA CLI API HTTP client wrapper
│       ├── config.ts         # Secure local JSON configuration reader/writer
│       ├── detector.ts       # Workspace environment auditing engine
│       ├── mcp.ts            # MCP configuration utility & dynamic loader
│       └── skills-parser.ts  # Markdown skills parser and validator
├── esbuild.config.js         # ESBuild configuration bundling TS into single CommonJS file
├── install.ps1               # Installer script for Windows / PowerShell
├── install.sh                # Installer script for macOS/Linux / Curl shell
├── package.json              # Project manifests & dependencies configurations
├── tsconfig.json             # TypeScript compiler settings
└── vitest.config.ts          # Testing configurations for Vitest
```

---

## Installation

You can install the JPA CLI using one of the following methods depending on your environment requirements:

### 1. Global Installation (via npm - Recommended)
Make sure you have **Node.js** (version 18 or higher) installed. Run the following command to install the CLI globally:
```bash
npm install -g @jagopakaiai/jpa-cli
```
Once installed, the `jpa-cli` command will be available globally in your terminal.

### 2. Run without Installation (via `npx`)
If you want to try or run the CLI instantly without installing it globally on your system, use `npx`:
```bash
npx @jagopakaiai/jpa-cli
```

### 3. Standalone Binary Installers (No Node.js Required)
If you do not have Node.js / npm installed on your machine, you can download a compiled standalone binary:

#### macOS / Linux (via curl)
Download the platform-specific compiled binary and move it to `/usr/local/bin` automatically with:
```bash
curl -fsSL https://raw.githubusercontent.com/jagopakaiai/jpa-cli/main/install.sh | sh
```

#### Windows (via PowerShell)
Open PowerShell and run the following command to download the Windows executable and append it to your User Environment PATH:
```powershell
irm https://raw.githubusercontent.com/jagopakaiai/jpa-cli/main/install.ps1 | iex
```

---

## CLI Commands

When run without commands or arguments, `jpa-cli` launches an interactive main menu console displaying all available features. You can also run commands directly with options:

### 1. `jpa-cli keys [provider] [key]`
Manages API keys for various AI providers (Gemini, OpenRouter, and Groq). 
```bash
# Start the interactive keys wizard
jpa-cli keys

# Save a specific provider's API key directly
jpa-cli keys gemini <api-key>
jpa-cli keys openrouter <api-key>
jpa-cli keys groq <api-key>
```

---

### 2. `jpa-cli detect`
Scans the current workspace directory to audit the existing configurations and active project environment.
```bash
jpa-cli detect
```
It prints a detailed summary displaying:
- Workspace absolute path.
- Repository configuration (Git active).
- AI agent configuration files present (`.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`).
- Project stack languages & frameworks.
- Active AI provider API keys credentials status.

---

### 3. `jpa-cli init`
Guides you through setting up a new project workspace.
```bash
jpa-cli init
```
- Scans and detects installed system AI agents (Claude Code, Cline/Roo-Code, Antigravity, etc.).
- Prompt for project name, technology stack, goal, and workflow style (e.g. TDD, Feature-Driven).
- Generates configured rule files (`.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`) pre-populated with your chosen stack and workflow guidelines.
- Prompts to sync a skill profile from the local catalog.
- Generates a tailored `PRD.md` (Product Requirements Document) inside the root directory.

---

### 4. `jpa-cli skills`
Lists all available local/custom instruction profiles and audits their synchronization status in the current project files.
```bash
jpa-cli skills
```

---

### 5. `jpa-cli sync [skill-name]`
Synchronizes and writes custom editor instruction rules for the specified skill from the local catalog directly into your workspace.
```bash
jpa-cli sync laravel-clean-api
```
- If multiple environments are detected (e.g. both Cursor and Claude Code settings are found), you will be interactively prompted to choose which rule files to write to.
- It displays animated spinners and logs successful sync writes.

---

### 6. `jpa-cli mcp [install-name]`
Lists, views, and installs curated Model Context Protocol (MCP) servers to extend AI coding assistant capabilities.
```bash
# Start the interactive recommended MCP list & installation wizard
jpa-cli mcp

# Install a recommended MCP server directly (e.g., sqlite)
jpa-cli mcp sqlite
```
- Supports installation scripts for standard servers, customizing execution arguments (e.g. allowed paths for `filesystem`, DB files for `sqlite`/`postgres`, API Keys for `brave-search` or `github`).
- Directly registers the configuration inside the Claude Code configuration environment file (`~/.claudecode/config.json`).

---

## Development & Compilation

To build and compile the application locally:

### 1. Setup Dependencies
```bash
npm install
```

### 2. Run Test Suite
We use **Vitest** for testing. Run all unit tests:
```bash
npm test
```

### 3. Build & Package standalones
Compile the TypeScript files to `dist/index.js` using `esbuild` and pack native executables inside the `bin/` directory using `pkg`:
```bash
npm run package
```

---

## License
This project is open-source and licensed under the MIT License.
