# JagoPakaiAI CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a modern, interactive, and beautiful CLI tool called JagoPakaiAI CLI (`jagopakai`) in TypeScript and Node.js. It will allow logging in, detecting environment configurations, and syncing rules from an API, packaged into standalone binaries with custom installer scripts.

**Architecture:** Modular Command-Driven Architecture. Commands are placed in `src/commands/`, utility functions in `src/utils/`, packaged with `esbuild` and compiled with `pkg` to standalone binaries.

**Tech Stack:** TypeScript, Node.js, `commander`, `@clack/prompts`, `axios`, `esbuild`, `pkg`, `vitest` (for tests).

## Global Constraints
- Target platform support: macOS, Linux, Windows.
- Executable binary name: `jagopakai`.
- Node.js version target: Node 18 or above.
- Secure local configuration path: `~/.config/jagopakai/config.json`.
- API base URL: `https://jagopakaiai.my.id/api/skills`.
- Sync target files: `.cursorrules`, `.claudecoderc`, `.github/copilot-instructions.md`.

---

### Task 1: Scaffolding and Environment Configuration
Initialize the package, TypeScript compiler options, Vitest testing framework, and setup the standard folder structure.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: None
- Produces: Base configuration files for compiling, bundling, and testing.

- [ ] **Step 1: Create package.json**
  Write a `package.json` specifying dependencies, esbuild bundling script, and bin target.
  File: `D:\Projects\vibe\jagopakaiAI-cli\package.json`
  ```json
  {
    "name": "jagopakai",
    "version": "1.0.0",
    "description": "JagoPakaiAI CLI utility for managing AI agent rule configurations",
    "main": "dist/index.js",
    "bin": {
      "jagopakai": "./dist/index.js"
    },
    "type": "module",
    "scripts": {
      "build": "node esbuild.config.js",
      "test": "vitest run",
      "package": "npm run build && pkg . --out-path bin"
    },
    "dependencies": {
      "@clack/prompts": "^0.7.0",
      "axios": "^1.6.8",
      "commander": "^12.0.0"
    },
    "devDependencies": {
      "@types/node": "^20.11.0",
      "esbuild": "^0.20.1",
      "pkg": "^5.8.1",
      "typescript": "^5.3.3",
      "vitest": "^1.3.1"
    },
    "pkg": {
      "scripts": "dist/**/*.js",
      "targets": [
        "node18-linux-x64",
        "node18-macos-x64",
        "node18-macos-arm64",
        "node18-win-x64"
      ]
    }
  }
  ```

- [ ] **Step 2: Create tsconfig.json**
  File: `D:\Projects\vibe\jagopakaiAI-cli\tsconfig.json`
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "rootDir": "./src",
      "outDir": "./dist",
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "skipLibCheck": true
    },
    "include": ["src/**/*"]
  }
  ```

- [ ] **Step 3: Create vitest.config.ts**
  File: `D:\Projects\vibe\jagopakaiAI-cli\vitest.config.ts`
  ```typescript
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      globals: true,
      environment: 'node',
    },
  });
  ```

- [ ] **Step 4: Create source directories**
  Ensure directories `src/commands` and `src/utils` exist. (No actions needed since file writing creates parent folders).

- [ ] **Step 5: Run npm install**
  Run: `npm install` in workspace directory to download all dependencies.
  Expected: Node modules are installed successfully.

- [ ] **Step 6: Commit changes**
  Add files and commit.
  ```bash
  git init
  git add package.json tsconfig.json vitest.config.ts
  git commit -m "chore: scaffold project structure and install dependencies"
  ```

---

### Task 2: Config Helper Utilities
Implement the secure configuration utility to save and retrieve the API Key.

**Files:**
- Create: `src/utils/config.ts`
- Create: `src/utils/config.test.ts`

**Interfaces:**
- Produces: `getConfigPath()`, `saveApiKey(key: string)`, `getApiKey()`, `deleteApiKey()` functions.

- [ ] **Step 1: Write config utility tests**
  File: `src/utils/config.test.ts`
  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import fs from 'fs';
  import path from 'path';
  import { saveApiKey, getApiKey, deleteApiKey } from './config.js';

  describe('Config Utility', () => {
    beforeEach(() => {
      deleteApiKey();
    });

    afterEach(() => {
      deleteApiKey();
    });

    it('should save and retrieve the API key', () => {
      const testKey = 'test-api-key-12345';
      saveApiKey(testKey);
      expect(getApiKey()).toBe(testKey);
    });

    it('should return null when key does not exist', () => {
      expect(getApiKey()).toBeNull();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/utils/config.test.ts`
  Expected: FAIL with missing module error.

- [ ] **Step 3: Write config implementation**
  File: `src/utils/config.ts`
  ```typescript
  import fs from 'fs';
  import path from 'path';
  import os from 'os';

  const CONFIG_DIR = path.join(os.homedir(), '.config', 'jagopakai');
  const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

  export function getConfigPath(): string {
    return CONFIG_FILE;
  }

  export function saveApiKey(key: string): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const config = { apiKey: key };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  export function getApiKey(): string | null {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(data);
      return config.apiKey || null;
    } catch {
      return null;
    }
  }

  export function deleteApiKey(): void {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/utils/config.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Add files and commit.
  ```bash
  git add src/utils/config.ts src/utils/config.test.ts
  git commit -m "feat: implement config utility and tests"
  ```

---

### Task 3: Workspace detector utility
Implement the environment scanning utility to detect which developers tools (Cursor, Claude Code, GitHub Copilot) are active.

**Files:**
- Create: `src/utils/detector.ts`
- Create: `src/utils/detector.test.ts`

**Interfaces:**
- Produces: `detectWorkspace(dir: string)` returning `DetectedEnv` type with configurations.

- [ ] **Step 1: Write detector utility tests**
  File: `src/utils/detector.test.ts`
  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import fs from 'fs';
  import path from 'path';
  import os from 'os';
  import { detectWorkspace } from './detector.js';

  const TEMP_TEST_DIR = path.join(os.tmpdir(), 'jagopakai-test-workspace');

  describe('Workspace Detector Utility', () => {
    beforeEach(() => {
      if (fs.existsSync(TEMP_TEST_DIR)) {
        fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(TEMP_TEST_DIR);
    });

    afterEach(() => {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    });

    it('should detect Cursor if .cursorrules exists', () => {
      fs.writeFileSync(path.join(TEMP_TEST_DIR, '.cursorrules'), '');
      const env = detectWorkspace(TEMP_TEST_DIR);
      expect(env.cursor).toBe(true);
    });

    it('should detect Claude Code if .claudecoderc exists', () => {
      fs.writeFileSync(path.join(TEMP_TEST_DIR, '.claudecoderc'), '');
      const env = detectWorkspace(TEMP_TEST_DIR);
      expect(env.claude).toBe(true);
    });

    it('should detect Copilot if .github/copilot-instructions.md exists', () => {
      fs.mkdirSync(path.join(TEMP_TEST_DIR, '.github'));
      fs.writeFileSync(path.join(TEMP_TEST_DIR, '.github', 'copilot-instructions.md'), '');
      const env = detectWorkspace(TEMP_TEST_DIR);
      expect(env.copilot).toBe(true);
    });

    it('should detect Git repository if .git directory exists', () => {
      fs.mkdirSync(path.join(TEMP_TEST_DIR, '.git'));
      const env = detectWorkspace(TEMP_TEST_DIR);
      expect(env.git).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/utils/detector.test.ts`
  Expected: FAIL

- [ ] **Step 3: Write detector implementation**
  File: `src/utils/detector.ts`
  ```typescript
  import fs from 'fs';
  import path from 'path';

  export interface DetectedEnv {
    cursor: boolean;
    claude: boolean;
    copilot: boolean;
    git: boolean;
    vscode: boolean;
    projectType: string | null;
  }

  export function detectWorkspace(dir: string): DetectedEnv {
    const env: DetectedEnv = {
      cursor: false,
      claude: false,
      copilot: false,
      git: false,
      vscode: false,
      projectType: null
    };

    if (fs.existsSync(path.join(dir, '.cursorrules'))) {
      env.cursor = true;
    }
    if (fs.existsSync(path.join(dir, '.claudecoderc')) || fs.existsSync(path.join(dir, '.claudecode'))) {
      env.claude = true;
    }
    if (fs.existsSync(path.join(dir, '.github', 'copilot-instructions.md'))) {
      env.copilot = true;
    }
    if (fs.existsSync(path.join(dir, '.git'))) {
      env.git = true;
    }
    if (fs.existsSync(path.join(dir, '.vscode'))) {
      env.vscode = true;
    }

    // Attempt to guess project type/framework
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      env.projectType = 'NodeJS/JavaScript';
    } else if (fs.existsSync(path.join(dir, 'composer.json'))) {
      env.projectType = 'PHP/Laravel';
    } else if (fs.existsSync(path.join(dir, 'requirements.txt')) || fs.existsSync(path.join(dir, 'pyproject.toml'))) {
      env.projectType = 'Python';
    } else if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
      env.projectType = 'Rust';
    } else if (fs.existsSync(path.join(dir, 'go.mod'))) {
      env.projectType = 'Go';
    }

    return env;
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/utils/detector.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Add files and commit.
  ```bash
  git add src/utils/detector.ts src/utils/detector.test.ts
  git commit -m "feat: implement environment detection and tests"
  ```

---

### Task 4: API Client Utility
Implement the axios wrapper to fetch skills/rules from `https://jagopakaiai.my.id/api/skills`.

**Files:**
- Create: `src/utils/api.ts`
- Create: `src/utils/api.test.ts`

**Interfaces:**
- Produces: `fetchSkillRule(apiKey: string, skillName: string)` returning string content of rule.

- [ ] **Step 1: Write API client tests**
  File: `src/utils/api.test.ts`
  ```typescript
  import { describe, it, expect, vi } from 'vitest';
  import axios from 'axios';
  import { fetchSkillRule } from './api.js';

  vi.mock('axios');

  describe('API Utility', () => {
    it('should query API and return rule content', async () => {
      const mockResponse = { data: { content: 'test-rule-content-here' } };
      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const content = await fetchSkillRule('dummy-key', 'laravel-clean-api');
      expect(content).toBe('test-rule-content-here');
      expect(axios.get).toHaveBeenCalledWith(
        'https://jagopakaiai.my.id/api/skills/laravel-clean-api',
        {
          headers: {
            Authorization: 'Bearer dummy-key'
          }
        }
      );
    });

    it('should fallback to query param or return error message on failure', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

      await expect(fetchSkillRule('dummy-key', 'laravel-clean-api')).rejects.toThrow('Failed to retrieve skill: Network Error');
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/utils/api.test.ts`
  Expected: FAIL

- [ ] **Step 3: Write API client implementation**
  File: `src/utils/api.ts`
  ```typescript
  import axios from 'axios';

  export async function fetchSkillRule(apiKey: string, skillName: string): Promise<string> {
    const url = `https://jagopakaiai.my.id/api/skills/${encodeURIComponent(skillName)}`;
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      // Support standard content or content fallback
      if (response.data && typeof response.data.content === 'string') {
        return response.data.content;
      } else if (response.data && typeof response.data.rules === 'string') {
        return response.data.rules;
      } else {
        throw new Error('API response did not return rule content in expected format.');
      }
    } catch (error: any) {
      // In case path parameter returns 404, we can attempt query parameter fallback
      const fallbackUrl = `https://jagopakaiai.my.id/api/skills?name=${encodeURIComponent(skillName)}`;
      try {
        const fallbackRes = await axios.get(fallbackUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (fallbackRes.data && typeof fallbackRes.data.content === 'string') {
          return fallbackRes.data.content;
        } else if (fallbackRes.data && Array.isArray(fallbackRes.data)) {
          // If the list is returned, find by name
          const found = fallbackRes.data.find((s: any) => s.name === skillName || s.slug === skillName);
          if (found && typeof found.content === 'string') return found.content;
        }
      } catch {}

      throw new Error(`Failed to retrieve skill: ${error.message || error}`);
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/utils/api.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit changes**
  Add files and commit.
  ```bash
  git add src/utils/api.ts src/utils/api.test.ts
  git commit -m "feat: implement API client wrapper with fallback and tests"
  ```

---

### Task 5: Command Handlers (login, detect, sync)
Create the logic for commander commands.

**Files:**
- Create: `src/commands/login.ts`
- Create: `src/commands/detect.ts`
- Create: `src/commands/sync.ts`

**Interfaces:**
- Produces: `loginCommand()`, `detectCommand()`, `syncCommand(skillName: string)` handlers.

- [ ] **Step 1: Write login command**
  File: `src/commands/login.ts`
  ```typescript
  import * as p from '@clack/prompts';
  import { saveApiKey } from '../utils/config.js';

  export async function loginCommand() {
    p.intro('JagoPakaiAI Login');
    const apiKey = await p.password({
      message: 'Enter your JagoPakaiAI API Key:',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'API Key is required!';
      }
    });

    if (p.isCancel(apiKey)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    saveApiKey(apiKey as string);
    p.outro('Successfully logged in! Your API key is saved.');
  }
  ```

- [ ] **Step 2: Write detect command**
  File: `src/commands/detect.ts`
  ```typescript
  import * as p from '@clack/prompts';
  import { getApiKey } from '../utils/config.js';
  import { detectWorkspace } from '../utils/detector.js';

  export async function detectCommand() {
    p.intro('JagoPakaiAI Workspace Detector');
    
    const s = p.spinner();
    s.start('Scanning directory...');
    const currentDir = process.cwd();
    const env = detectWorkspace(currentDir);
    s.stop('Scan complete!');

    const apiKey = getApiKey();
    const apiKeyStatus = apiKey ? 'Active (Key Saved)' : 'Missing (Use "jagopakai login" to authenticate)';

    const details = [
      `Workspace: ${currentDir}`,
      `API Key: ${apiKeyStatus}`,
      `Git Repo: ${env.git ? 'Yes' : 'No'}`,
      `Cursor Rules Config: ${env.cursor ? 'Detected' : 'Not found'}`,
      `Claude Code Config: ${env.claude ? 'Detected' : 'Not found'}`,
      `Copilot Config: ${env.copilot ? 'Detected' : 'Not found'}`,
      `Project Type: ${env.projectType || 'Unknown/Generic'}`
    ].join('\n');

    p.note(details, 'Audit Summary');
    p.outro('To sync rules, run: jagopakai sync <skill-name>');
  }
  ```

- [ ] **Step 3: Write sync command**
  File: `src/commands/sync.ts`
  ```typescript
  import fs from 'fs';
  import path from 'path';
  import * as p from '@clack/prompts';
  import { getApiKey } from '../utils/config.js';
  import { detectWorkspace } from '../utils/detector.js';
  import { fetchSkillRule } from '../utils/api.js';

  export async function syncCommand(skillName: string | undefined) {
    p.intro('JagoPakaiAI Config Synchronizer');

    const apiKey = getApiKey();
    if (!apiKey) {
      p.log.error('Authentication required! Please run "jagopakai login" first.');
      process.exit(1);
    }

    if (!skillName) {
      const inputSkill = await p.text({
        message: 'Enter the skill name to sync (e.g. laravel-api-clean):',
        validate: (value) => {
          if (!value || value.trim().length === 0) return 'Skill name is required!';
        }
      });
      if (p.isCancel(inputSkill)) {
        p.cancel('Sync cancelled.');
        process.exit(0);
      }
      skillName = inputSkill as string;
    }

    const currentDir = process.cwd();
    const env = detectWorkspace(currentDir);

    const availableConfigs = [];
    if (env.cursor) availableConfigs.push({ value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' });
    if (env.claude) availableConfigs.push({ value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' });
    if (env.copilot) availableConfigs.push({ value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' });

    // Fallbacks if nothing detected
    if (availableConfigs.length === 0) {
      availableConfigs.push(
        { value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' },
        { value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' },
        { value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' }
      );
    }

    let selectedTargets: string[] = [];
    if (availableConfigs.length === 1) {
      selectedTargets = [availableConfigs[0].value];
    } else {
      const selection = await p.multiselect({
        message: 'Select AI rule configs to write to:',
        options: availableConfigs,
        required: true
      });
      if (p.isCancel(selection)) {
        p.cancel('Sync cancelled.');
        process.exit(0);
      }
      selectedTargets = selection as string[];
    }

    const s = p.spinner();
    s.start(`Fetching skill "${skillName}" rules...`);
    let ruleContent = '';
    try {
      ruleContent = await fetchSkillRule(apiKey, skillName);
      s.stop(`Successfully fetched "${skillName}" rules!`);
    } catch (err: any) {
      s.stop('Fetch failed!');
      p.log.error(err.message || String(err));
      process.exit(1);
    }

    const writeSpinner = p.spinner();
    writeSpinner.start('Writing rule configurations to files...');
    for (const target of selectedTargets) {
      const fullPath = path.join(currentDir, target);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, ruleContent);
      p.log.success(`Synchronized: ${target}`);
    }
    writeSpinner.stop('Writing complete!');

    p.outro('Synchronization successfully completed!');
  }
  ```

- [ ] **Step 4: Commit changes**
  Add files and commit.
  ```bash
  git add src/commands/login.ts src/commands/detect.ts src/commands/sync.ts
  git commit -m "feat: implement login, detect, and sync command modules"
  ```

---

### Task 6: CLI Entry Point and Bundle Script
Bind everything together inside the Commander program file, configure the esbuild bundle settings, and prepare compilation tests.

**Files:**
- Create: `src/index.ts`
- Create: `esbuild.config.js`

**Interfaces:**
- Produces: Fully compiled single executable script in `dist/index.js` running commands.

- [ ] **Step 1: Write CLI Entry Point**
  File: `src/index.ts`
  ```typescript
  #!/usr/bin/env node
  import { Command } from 'commander';
  import { loginCommand } from './commands/login.js';
  import { detectCommand } from './commands/detect.ts';
  import { syncCommand } from './commands/sync.ts';

  const program = new Command();

  program
    .name('jagopakai')
    .description('JagoPakaiAI Command Line Interface rules synchronizer')
    .version('1.0.0');

  program
    .command('login')
    .description('Authenticate with your JagoPakaiAI API Key')
    .action(async () => {
      await loginCommand();
    });

  program
    .command('detect')
    .description('Scan current workspace environment and files')
    .action(async () => {
      await detectCommand();
    });

  program
    .command('sync')
    .argument('[skill-name]', 'Name/slug of the skill to sync rules for')
    .description('Pull rules for a skill and synchronize in workspace')
    .action(async (skillName) => {
      await syncCommand(skillName);
    });

  program.parse(process.argv);
  ```

- [ ] **Step 2: Write esbuild config**
  File: `esbuild.config.js`
  ```javascript
  import esbuild from 'esbuild';

  esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/index.js',
    banner: {
      js: '#!/usr/bin/env node\nimport { createRequire } from "module"; const require = createRequire(import.meta.url);'
    },
    // Make sure we resolve node imports correctly
    external: [],
  }).then(() => {
    console.log('Build completed successfully!');
  }).catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
  ```

- [ ] **Step 3: Run esbuild build**
  Run: `npm run build`
  Expected: Successful exit and output of file `dist/index.js`.

- [ ] **Step 4: Run unit tests**
  Run: `npm test`
  Expected: All tests pass.

- [ ] **Step 5: Commit changes**
  Add files and commit.
  ```bash
  git add src/index.ts esbuild.config.js
  git commit -m "feat: implement commander CLI entrypoint and esbuild bundler config"
  ```

---

### Task 7: Setup Standalone Packaging with pkg
Test packaging the bundler code into actual native binaries using pkg.

**Files:**
- Modify: `package.json:10-15` (Verify script to run pkg)

**Interfaces:**
- Produces: Test standalone executable file for user's host platform.

- [ ] **Step 1: Compile binaries locally using pkg**
  Run: `npx pkg . --out-path bin`
  Expected: Standalone binaries generated inside `bin/` directory.

- [ ] **Step 2: Verify binary works (detect)**
  Run: `.\bin\jagopakai-win-x64.exe --help` or corresponding binary.
  Expected: Outputs the help commands of `jagopakai`.

- [ ] **Step 3: Commit updates**
  ```bash
  git commit -am "chore: configure and test local binary package generation"
  ```

---

### Task 8: Distribution Assets
Generate installer scripts `install.sh`, `install.ps1`, Homebrew Formula `jagopakai.rb`, and GitHub Actions release config.

**Files:**
- Create: `install.sh`
- Create: `install.ps1`
- Create: `jagopakai.rb`
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Produces: Script installers and CI workflows.

- [ ] **Step 1: Create install.sh**
  File: `install.sh`
  ```bash
  #!/bin/sh
  set -e

  OWNER="username"
  REPO="jagopakai-cli"
  BINARY="jagopakai"

  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  case "$OS" in
    darwin)
      if [ "$ARCH" = "arm64" ]; then
        SUFFIX="macos-arm64"
      else
        SUFFIX="macos-x64"
      fi
      ;;
    linux)
      SUFFIX="linux-x64"
      ;;
    *)
      echo "Unsupported OS: $OS"
      exit 1
      ;;
  esac

  URL="https://github.com/$OWNER/$REPO/releases/latest/download/${BINARY}-${SUFFIX}"
  DEST="/usr/local/bin/$BINARY"

  echo "Downloading $BINARY for $OS-$ARCH..."
  curl -L "$URL" -o "$BINARY"
  chmod +x "$BINARY"

  echo "Installing to $DEST (requires sudo)..."
  sudo mv "$BINARY" "$DEST"
  echo "JagoPakaiAI CLI installed successfully!"
  ```

- [ ] **Step 2: Create install.ps1**
  File: `install.ps1`
  ```powershell
  $owner = "username"
  $repo = "jagopakai-cli"
  $binary = "jagopakai"
  $suffix = "win-x64.exe"

  $url = "https://github.com/$owner/$repo/releases/latest/download/${binary}-${suffix}"
  $installDir = Join-Path $env:USERPROFILE ".jagopakai\bin"
  $dest = Join-Path $installDir "${binary}.exe"

  if (!(Test-Path $installDir)) {
      New-Item -ItemType Directory -Force -Path $installDir | Out-Null
  }

  Write-Host "Downloading JagoPakaiAI CLI from $url..."
  Invoke-WebRequest -Uri $url -OutFile $dest

  Write-Host "Adding $installDir to User PATH..."
  $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if ($currentPath -split ";" -notcontains $installDir) {
      [Environment]::SetEnvironmentVariable("Path", $currentPath + ";" + $installDir, "User")
      $env:Path += ";$installDir"
  }

  Write-Host "JagoPakaiAI CLI installed successfully! Please restart your terminal."
  ```

- [ ] **Step 3: Create Homebrew Formula**
  File: `jagopakai.rb`
  ```ruby
  class Jagopakai < Formula
    desc "JagoPakaiAI CLI rules configuration manager"
    homepage "https://github.com/username/jagopakai-cli"
    url "https://github.com/username/jagopakai-cli/releases/latest/download/jagopakai-macos-x64"
    # We could supply both arm64 and x64 logic
    version "1.0.0"
    sha256 "replace-with-checksum-during-release"

    def install
      if Hardware::CPU.intel?
        bin.install "jagopakai-macos-x64" => "jagopakai"
      else
        bin.install "jagopakai-macos-arm64" => "jagopakai"
      end
    end

    test do
      system "#{bin}/jagopakai", "--version"
    end
  end
  ```

- [ ] **Step 4: Create release.yml GitHub Action**
  File: `.github/workflows/release.yml`
  ```yaml
  name: Release Build

  on:
    push:
      tags:
        - 'v*'

  jobs:
    build-and-release:
      runs-on: ubuntu-latest
      permissions:
        contents: write
      steps:
        - name: Checkout Repository
          uses: actions/checkout@v4

        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-size: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build JS bundle
          run: npm run build

        - name: Package standalone binaries
          run: |
            npx pkg . --out-path bin
            mv bin/jagopakai-linux-x64 bin/jagopakai-linux
            mv bin/jagopakai-win-x64.exe bin/jagopakai.exe

        - name: Release and Attach Assets
          uses: softprops/action-gh-release@v2
          with:
            files: |
              bin/jagopakai-linux
              bin/jagopakai-macos-x64
              bin/jagopakai-macos-arm64
              bin/jagopakai.exe
              install.sh
              install.ps1
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

- [ ] **Step 5: Commit installer changes**
  ```bash
  git add install.sh install.ps1 jagopakai.rb .github/workflows/release.yml
  git commit -m "feat: add installation scripts, Homebrew Formula, and GitHub Release action workflow"
  ```
