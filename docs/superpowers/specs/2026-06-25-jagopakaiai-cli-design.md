# Design Document: JagoPakaiAI CLI (jagopakai)

**Date**: 2026-06-25  
**Status**: Approved

## 1. Overview
JagoPakaiAI CLI (`jagopakai`) is a Node.js/TypeScript-based command-line tool that enables developers to detect their workspace environment and sync AI Agent rule files (like `.cursorrules`, `.claudecoderc`, or `.github/copilot-instructions.md`) from the JagoPakaiAI API.

## 2. Core Architecture
We adopt a **Modular Command-Driven Architecture** using the following stack:
- **TypeScript & Node.js**
- **commander**: CLI command parser
- **@clack/prompts**: Interactive terminal prompt rendering
- **axios** or **undici/fetch**: API requests
- **esbuild**: Code bundling (into a single JS file)
- **pkg**: Packaging the single JS file into standalone binary executables for macOS, Linux, and Windows.

### Directory Structure
```
jagopakaiAI-cli/
├── src/
│   ├── index.ts              # Entry point (commander definition)
│   ├── commands/
│   │   ├── login.ts          # CLI Login handler
│   │   ├── detect.ts         # CLI Detect handler
│   │   └── sync.ts           # CLI Sync handler
│   └── utils/
│       ├── config.ts         # Configuration reader/writer (~/.config/jagopakai/config.json)
│       ├── detector.ts       # Workspace environment detector
│       └── api.ts            # API interaction helper
├── package.json
├── tsconfig.json
├── esbuild.config.js
├── install.sh                # curl installer for Unix
├── install.ps1               # PowerShell installer for Windows
├── jagopakai.rb              # Homebrew Formula
└── .github/
    └── workflows/
        └── release.yml       # Release & cross-compilation pipeline
```

## 3. Command Specifications

### 3.1. `jagopakai login`
- **Behavior**:
  - Interactively prompts for the JagoPakaiAI API Key.
  - Validates formatting.
  - Saves the API key to `~/.config/jagopakai/config.json`.
- **Output**: Clean feedback indicating successful login.

### 3.2. `jagopakai detect`
- **Behavior**:
  - Checks if the user is authenticated (checks `config.json` for API key).
  - Scans current working directory (`process.cwd()`) recursively or at root for:
    - `.git/` (Git repository)
    - `.cursorrules` (Cursor config)
    - `.claudecoderc` / `.claudecode/` (Claude Code config)
    - `.vscode/` (VS Code workspace settings)
    - `.github/copilot-instructions.md` (GitHub Copilot config)
    - `package.json` / `composer.json` / `requirements.txt` (identifies project language/framework)
  - Prints a beautifully styled list of detected files/environments.
  - Indicates API key status (Active / Missing).

### 3.3. `jagopakai sync [skill-name]`
- **Behavior**:
  - Requires active API key. If missing, prompts user to login.
  - Sends a GET request to `https://jagopakaiai.my.id/api/skills` with `Authorization: Bearer <API_KEY>` or fetches the specific skill.
    - We will request `https://jagopakaiai.my.id/api/skills/[skill-name]` or `https://jagopakaiai.my.id/api/skills?name=[skill-name]`.
  - Parses the response JSON (expected structure: `{ "content": "..." }`).
  - If multiple target config files are supported/detected in the workspace:
    - Interactively prompts the user to select which config files to write (e.g., `.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`).
  - Writes the fetched rule content to selected paths.
  - Uses `@clack/prompts` spin indicators and custom CLI progress layout to display synchronization status.

## 4. Distribution and Packaging
- **Local compilation**: Use `esbuild` to compile TypeScript down to a single ESM or CommonJS file: `dist/index.js`.
- **Executable packaging**: Use `pkg` targeting node18/node20 to generate standalone binaries.
- **Installers**:
  - `install.sh`: Downloads latest release for client's OS from GitHub Releases and copies it to `/usr/local/bin`.
  - `install.ps1`: Downloads latest Windows release and adds it to User's PATH.
  - `jagopakai.rb`: Defines Homebrew installation strategy.
  - `.github/workflows/release.yml`: Automates builds on tag release using GitHub runner, publishing binaries.

## 5. Security & Error Handling
- Saves config files with limited read/write permissions where possible.
- Handles empty/invalid API keys, offline/network failures, and missing files/directories gracefully with `@clack/prompts` error message styling.
