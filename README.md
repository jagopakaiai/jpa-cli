# JagoPakaiAI CLI (`jagopakaiai-cli`)

[![GitHub Release](https://img.shields.io/github/v/release/jagopakaiai/jagopakaiAI-cli?style=flat-square)](https://github.com/jagopakaiai/jagopakaiAI-cli/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/jagopakaiai/jagopakaiAI-cli/release.yml?style=flat-square)](https://github.com/jagopakaiai/jagopakaiAI-cli/actions)
[![License](https://img.shields.io/github/license/jagopakaiai/jagopakaiAI-cli?style=flat-square)](LICENSE)

**JagoPakaiAI CLI** is a modern Command Line Interface utility designed to automatically detect, manage, and synchronize local AI Agent and Editor rule configurations (such as `.cursorrules`, `.claudecoderc`, and `.github/copilot-instructions.md`) directly in your workspace. 

Synchronize custom and community-developed developer instructions (skills) directly from the JagoPakaiAI API to optimize your AI coding experience.

---

## ✨ Features

- ⚙️ **Interactive Prompts**: Beautiful, styled prompts, spin indicators, and menus powered by `@clack/prompts`.
- 🔍 **Auto-Environment Detection**: Intelligently scans the current workspace for Git repositories, active AI/Editor configuration files, and project stack languages (Node.js, Laravel/PHP, Python, Rust, Go).
- 🔄 **Multi-Target Synchronization**: Sync single skill configurations to one or more rules files simultaneously (`.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`).
- 🔒 **Secure Local Config**: Saves your API keys securely inside your local machine profile folder (`~/.config/jagopakaiai-cli/config.json`).
- 📦 **Zero-Dependency Native Binaries**: Distributed as standalone executable binaries for macOS, Linux, and Windows.

---

## 📂 Project Directory Structure

```text
jagopakaiAI-cli/
├── .github/
│   └── workflows/
│       └── release.yml       # Release & cross-compilation GitHub Actions pipeline
├── bin/                      # Compiled native executables (gitignored)
├── dist/                     # Compiled JS bundle (gitignored)
├── docs/                     # Design & architecture documentation
│   ├── api-guide.md          # API Integration & payload guide
│   └── user-guide.md         # Advanced usage & configuration guide
│   └── superpowers/
│       ├── specs/            # Technical specifications
│       └── plans/            # Actionable implementation plans
├── src/                      # TypeScript source code
│   ├── commands/             # CLI commander actions
│   │   ├── detect.ts         # 'detect' environment action
│   │   ├── login.ts          # 'login' interactive credentials action
│   │   └── sync.ts           # 'sync' API rules synchronization action
│   │   index.ts              # Commander routing entrypoint
│   └── utils/                # Utility helpers
│       ├── api.ts            # JagoPakaiAI API HTTP client wrapper
│       ├── config.ts         # Secure local JSON configuration reader/writer
│       └── detector.ts       # Workspace environment auditing engine
├── .gitignore                # Git paths to ignore
├── esbuild.config.js         # ESBuild configuration bundling TS into single CommonJS file
├── install.ps1               # Installer script for Windows / PowerShell
├── install.sh                # Installer script for macOS/Linux / Curl shell
├── jagopakaiai-cli.rb        # Homebrew Formula specification
├── package.json              # Project manifests & dependencies configurations
├── tsconfig.json             # TypeScript compiler settings
└── vitest.config.ts          # Testing configurations for Vitest
```

---

## 🚀 Installation

You can install the JagoPakaiAI CLI using one of the following methods depending on your environment requirements:

### 1. Global Installation (via npm - Recommended)
Make sure you have **Node.js** (version 18 or higher) installed. Run the following command to install the CLI globally:
```bash
npm install -g jagopakaiai-cli
```
Once installed, the `jagopakaiai-cli` command will be available globally in your terminal.

### 2. Run without Installation (via `npx`)
If you want to try or run the CLI instantly without installing it globally on your system, use `npx`:
```bash
npx jagopakaiai-cli
```

### 3. Standalone Binary Installers (No Node.js Required)
If you do not have Node.js / npm installed on your machine, you can download a compiled standalone binary:

#### 💻 macOS / Linux (via curl)
Download the platform-specific compiled binary and move it to `/usr/local/bin` automatically with:
```bash
curl -fsSL https://raw.githubusercontent.com/jagopakaiai/jagopakaiAI-cli/main/install.sh | sh
```

#### 🖥️ Windows (via PowerShell)
Open PowerShell and run the following command to download the Windows executable and append it to your User Environment PATH:
```powershell
irm https://raw.githubusercontent.com/jagopakaiai/jagopakaiAI-cli/main/install.ps1 | iex
```

#### 🍺 macOS (via Homebrew)
Install using our Homebrew tap formula:
```bash
brew install jagopakaiai/tap/jagopakaiai-cli
```

---

## 💻 CLI Commands

### 🔑 1. `jagopakaiai-cli login`
Authenticates with your JagoPakaiAI credentials. You will be prompted to enter your API Key.
```bash
jagopakaiai-cli login
```
The key is securely written to your home directory:
`~/.config/jagopakaiai-cli/config.json`

---

### 🔑 2. `jagopakaiai-cli keys`
Manages API keys for various AI providers (Gemini, OpenRouter, Groq, and JagoPakaiAI). You can run this command to start an interactive management manager wizard, or supply credentials directly.
```bash
# Start the interactive keys wizard
jagopakaiai-cli keys

# Save a specific provider's API key directly
jagopakaiai-cli keys groq <api-key>
jagopakaiai-cli keys gemini <api-key>
jagopakaiai-cli keys openrouter <api-key>
jagopakaiai-cli keys jagopakaiai <api-key>
```

---

### 🔍 3. `jagopakaiai-cli detect`
Scans the current workspace directory to audit the existing configurations and active project environment.
```bash
jagopakaiai-cli detect
```
Example Output:
```text
┌  JagoPakaiAI Workspace Detector
│
◇  Scan complete!
│
◇  Audit Summary ────────────────────────────────────────────╮
│                                                            │
│  Workspace: /home/user/my-project                          │
│  API Key: Active (Key Saved)                               │
│  Git Repo: Yes                                             │
│  Cursor Rules Config: Not found                            │
│  Claude Code Config: Detected                              │
│  Copilot Config: Not found                                 │
│  Project Type: NodeJS/JavaScript                           │
│                                                            │
├────────────────────────────────────────────────────────────╯
│
└  To sync rules, run: jagopakaiai-cli sync <skill-name>
```

---

### 🔄 4. `jagopakaiai-cli sync [skill-name]`
Synchronizes and writes custom editor instruction rules for the specified skill from the JagoPakaiAI API directly into your workspace.
```bash
jagopakaiai-cli sync laravel-clean-api
```
- If multiple environments are detected (e.g. both Cursor and Claude Code settings are found), you will be interactively prompted to choose which rule files to write to.
- It displays beautiful animated spinners and logs successful sync writes.

---

## 🛠️ Development & Compilation

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

## 📄 License
This project is open-source and licensed under the MIT License.
