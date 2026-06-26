# MCP Registry Scraper and Setup Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrape all 110 MCP registry servers and copy reference servers into the `mcp` folder, generating standard `config.json` and `README.md` files for each, and updating the CLI to dynamically load these servers.

**Architecture:** We will implement a Python scraper script `playground/scrape_mcps.py` to fetch, extract, and write the MCP details from the GitHub registry pages. We will then update the TypeScript CLI files (`src/utils/mcp.ts` and `src/commands/mcp.ts`) to read these folders dynamically.

**Tech Stack:** Python 3 (with standard libraries: `urllib`, `re`, `json`, `concurrent.futures`), TypeScript, Node.js.

## Global Constraints
- Target directory is `mcp/` in the workspace root.
- Clean up any temporary folders in `playground/temp-servers` and `playground/temp-servers-archived` after scraping.
- Keep naming format for folders as lowercase `<owner>-<repo>`.

---

### Task 1: Create Scraper Script
Write the python script `playground/scrape_mcps.py` to fetch the 110 registry URLs and extract their metadata from the JSON payload embedded in the registry pages.

**Files:**
- Create: `playground/scrape_mcps.py`

**Interfaces:**
- Consumes: None
- Produces: `scrape_mcps.py` executable script

- [ ] **Step 1: Write the python scraper script**
  Create `playground/scrape_mcps.py` with the following content:
  ```python
  import os
  import re
  import json
  import urllib.request
  import urllib.error
  from concurrent.futures import ThreadPoolExecutor

  TARGET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'mcp')

  def get_registry_links():
      links = []
      for page in range(1, 5):
          url = f"https://github.com/mcp?page={page}"
          req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
          try:
              with urllib.request.urlopen(req) as resp:
                  html = resp.read().decode('utf-8')
                  found = re.findall(r'href="(/mcp/[^"?#"]+)"', html)
                  for l in found:
                      parts = l.strip('/').split('/')
                      if len(parts) == 3 and parts[0] == 'mcp':
                          links.append(f"https://github.com{l}")
          except Exception as e:
              print(f"Error page {page}: {e}")
      return sorted(list(set(links)))

  def fetch_detail(url):
      req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
      try:
          with urllib.request.urlopen(req) as resp:
              html = resp.read().decode('utf-8')
              matches = re.finditer(r'<script[^>]*>(.*?mcpDetailsRoute.*?)</script>', html, re.DOTALL)
              for match in matches:
                  content = match.group(1).strip()
                  start_pos = 0
                  while True:
                      json_start = content.find('{', start_pos)
                      if json_start == -1:
                          break
                      decoder = json.JSONDecoder()
                      try:
                          data, end_idx = decoder.raw_decode(content[json_start:])
                          if 'payload' in data and 'mcpDetailsRoute' in data['payload']:
                              return data['payload']['mcpDetailsRoute'].get('server_data')
                          start_pos = json_start + end_idx
                      except Exception:
                          start_pos = json_start + 1
      except Exception as e:
          print(f"Error detail {url}: {e}")
      return None

  def process_server(url):
      server_data = fetch_detail(url)
      if not server_data:
          return False
      
      name = server_data.get('name', '')
      normalized_name = name.lower().replace('/', '-')
      dest_folder = os.path.join(TARGET_DIR, normalized_name)
      os.makedirs(dest_folder, exist_ok=True)
      
      # Write README
      repo_data = server_data.get('repository', {})
      readme = repo_data.get('readme', '')
      with open(os.path.join(dest_folder, 'README.md'), 'w', encoding='utf-8') as f:
          f.write(readme)
      
      # Map package to config
      mcp_config = {
          "command": "",
          "args": [],
          "env": {}
      }
      
      raw_data = server_data.get('raw_data', {})
      server_info = raw_data.get('server', {})
      packages = server_info.get('packages', [])
      
      if packages:
          pkg = packages[0]
          identifier = pkg.get('identifier', '')
          hint = pkg.get('runtimeHint', '')
          reg_type = pkg.get('registryType', '')
          
          if hint == 'uvx' or reg_type == 'pypi':
              mcp_config['command'] = 'uvx'
              mcp_config['args'] = [identifier]
          elif hint == 'npx' or reg_type == 'npm':
              mcp_config['command'] = 'npx'
              mcp_config['args'] = ['-y', identifier]
          elif hint == 'pip':
              mcp_config['command'] = 'python'
              mcp_config['args'] = ['-m', identifier]
          else:
              mcp_config['command'] = 'npx'
              mcp_config['args'] = ['-y', identifier]
              
      metadata = {
          "name": name,
          "displayName": server_data.get('display_name', ''),
          "description": server_data.get('description', ''),
          "repository": repo_data.get('url', ''),
          "mcpConfig": mcp_config,
          "env": {}
      }
      
      with open(os.path.join(dest_folder, 'config.json'), 'w', encoding='utf-8') as f:
          json.dump(metadata, f, indent=2)
          
      print(f"Scraped {name} successfully.")
      return True

  if __name__ == '__main__':
      links = get_registry_links()
      print(f"Found {len(links)} server links to scrape.")
      with ThreadPoolExecutor(max_workers=10) as executor:
          executor.map(process_server, links)
  ```

- [ ] **Step 2: Verify script compilation**
  Run: `python -m py_compile playground/scrape_mcps.py`
  Expected: Command finishes successfully with exit code 0.

- [ ] **Step 3: Commit scraper script**
  Run: `git add playground/scrape_mcps.py; git commit -m "feat: add mcp registry scraper script"`

---

### Task 2: Run Scraper and Generate MCP Folders
Execute the scraper script to populate the `mcp/` directory.

**Files:**
- Modify: `mcp/` directory contents

**Interfaces:**
- Consumes: `playground/scrape_mcps.py`
- Produces: 110+ scraped server folders under `mcp/`

- [ ] **Step 1: Execute scraper**
  Run: `python playground/scrape_mcps.py`
  Expected: Output logs of scraped servers. 110 new directories created in `mcp/`.

- [ ] **Step 2: Verify folder contents**
  Check that at least one directory (e.g. `mcp/microsoft-markitdown`) has both `README.md` and `config.json` files.
  Expected: Both files exist and are populated with correct content.

- [ ] **Step 3: Commit the scraped folders**
  Run: `git add mcp/; git commit -m "feat: scrape all 110 mcp registry configurations"`

---

### Task 3: Integrate Local Reference Servers and Clean Up
Manually merge reference implementations from `playground/temp-servers` and `playground/temp-servers-archived` that are not already present or need local integration.

**Files:**
- Modify: `mcp/` directory
- Delete: `playground/temp-servers`, `playground/temp-servers-archived`

- [ ] **Step 1: Write script to merge local reference servers**
  Write a helper python script `playground/merge_references.py` to copy `README.md` files from the cloned directories and create standard `config.json` templates for reference servers like `sqlite`, `postgres`, `filesystem`, etc.
  ```python
  import os
  import shutil
  import json

  BASE_DIR = os.path.dirname(os.path.dirname(__file__))
  TEMP_SERVERS = os.path.join(BASE_DIR, 'playground', 'temp-servers', 'src')
  TEMP_ARCHIVED = os.path.join(BASE_DIR, 'playground', 'temp-servers-archived', 'src')
  TARGET_DIR = os.path.join(BASE_DIR, 'mcp')

  # Predefined reference server configs (from src/utils/mcp.ts)
  DEFS = {
      "sqlite": {
          "name": "sqlite",
          "displayName": "SQLite",
          "description": "SQLite database inspection and operations tool",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sqlite",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db", "sqlite.db"]
          }
      },
      "postgres": {
          "name": "postgres",
          "displayName": "Postgres",
          "description": "Postgres database connection and explorer tool",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-postgres"]
          }
      },
      "filesystem": {
          "name": "filesystem",
          "displayName": "Filesystem",
          "description": "Provides controlled local filesystem access to AI agents",
          "repository": "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
          }
      },
      "fetch": {
          "name": "fetch",
          "displayName": "Fetch",
          "description": "Fetches web content and converts HTML to markdown",
          "repository": "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-fetch"]
          }
      },
      "github": {
          "name": "github",
          "displayName": "GitHub",
          "description": "Enables repository, pull requests, and issues automation",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/github",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-github"]
          }
      },
      "memory": {
          "name": "memory",
          "displayName": "Memory",
          "description": "Graph-based knowledge indexing and semantic storage",
          "repository": "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-memory"]
          }
      },
      "brave-search": {
          "name": "brave-search",
          "displayName": "Brave Search",
          "description": "Brave Search engine API integration for web search capabilities",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/brave-search",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-brave-search"]
          }
      },
      "gmail": {
          "name": "gmail",
          "displayName": "Gmail",
          "description": "Gmail integration allowing reading, drafting, and sending emails",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/gmail",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-gmail"]
          }
      },
      "gcalendar": {
          "name": "gcalendar",
          "displayName": "Google Calendar",
          "description": "Google Calendar integration for scheduling and event tracking",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/gcalendar",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-gcalendar"]
          }
      },
      "docker": {
          "name": "docker",
          "displayName": "Docker",
          "description": "Manage and inspect local Docker containers and images",
          "repository": "https://github.com/modelcontextprotocol/servers-archived/tree/main/src/docker",
          "mcpConfig": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-docker"]
          }
      }
  }

  def merge():
      # Copy from temp-servers
      if os.path.exists(TEMP_SERVERS):
          for name in os.listdir(TEMP_SERVERS):
              src_dir = os.path.join(TEMP_SERVERS, name)
              if os.path.isdir(src_dir):
                  dest_dir = os.path.join(TARGET_DIR, name)
                  os.makedirs(dest_dir, exist_ok=True)
                  readme_src = os.path.join(src_dir, 'README.md')
                  if os.path.exists(readme_src):
                      shutil.copy(readme_src, os.path.join(dest_dir, 'README.md'))
                  
                  if name in DEFS:
                      with open(os.path.join(dest_dir, 'config.json'), 'w') as f:
                          json.dump(DEFS[name], f, indent=2)

      # Copy from temp-servers-archived
      if os.path.exists(TEMP_ARCHIVED):
          for name in os.listdir(TEMP_ARCHIVED):
              src_dir = os.path.join(TEMP_ARCHIVED, name)
              if os.path.isdir(src_dir):
                  dest_dir = os.path.join(TARGET_DIR, name)
                  os.makedirs(dest_dir, exist_ok=True)
                  readme_src = os.path.join(src_dir, 'README.md')
                  if os.path.exists(readme_src):
                      shutil.copy(readme_src, os.path.join(dest_dir, 'README.md'))
                  
                  if name in DEFS:
                      with open(os.path.join(dest_dir, 'config.json'), 'w') as f:
                          json.dump(DEFS[name], f, indent=2)

  if __name__ == '__main__':
      merge()
      print("Reference servers merged successfully.")
  ```

- [ ] **Step 2: Run merge references script**
  Run: `python playground/merge_references.py`
  Expected: Reference servers populated in `mcp/sqlite`, `mcp/filesystem`, etc.

- [ ] **Step 3: Clean up cloned repositories and temporary scripts**
  Run: `Remove-Item -Recurse -Force playground/temp-servers; Remove-Item -Recurse -Force playground/temp-servers-archived; Remove-Item playground/scrape_mcps.py; Remove-Item playground/merge_references.py; Remove-Item playground/check_github.py`
  Expected: Cloned repositories and temp helper scripts deleted.

- [ ] **Step 4: Commit cleanup and merge**
  Run: `git add mcp/; git commit -m "feat: merge reference servers and clean up temp files"`

---

### Task 4: Make CLI MCP Configuration Dynamic
Update `src/utils/mcp.ts` and `src/commands/mcp.ts` to dynamically scan the `mcp/` directory to discover available servers and install them.

**Files:**
- Modify: `src/utils/mcp.ts`
- Modify: `src/commands/mcp.ts`

**Interfaces:**
- Consumes: `mcp/` subdirectories and their `config.json` files
- Produces: Dynamic loading of MCP configurations during runtime

- [ ] **Step 1: Modify `src/utils/mcp.ts`**
  Modify [src/utils/mcp.ts](file:///D:/Projects/vibe/jagopakaiAI-cli/src/utils/mcp.ts) to read folders in `mcp/` directory and parse their `config.json` files dynamically.
  Replace `RECOMMENDED_MCPS` declaration with dynamic discovery:
  ```typescript
  import fs from 'fs';
  import path from 'path';
  import os from 'os';
  import { execSync } from 'child_process';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claudecode');
  const CLAUDE_CONFIG_FILE = path.join(CLAUDE_CONFIG_DIR, 'config.json');

  export interface McpServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }

  export interface ClaudeConfig {
    mcpServers?: Record<string, McpServerConfig>;
  }

  export interface McpDefinition {
    name: string;
    displayName?: string;
    description: string;
    package?: string; // fallback
    defaultArgs?: string[]; // fallback
    mcpConfig?: McpServerConfig;
  }

  // Load MCP Definitions dynamically from the mcp folder
  export function loadMcpDefinitions(): McpDefinition[] {
    const mcpDir = path.join(__dirname, '..', '..', 'mcp');
    const definitions: McpDefinition[] = [];
    
    if (!fs.existsSync(mcpDir)) {
      return [];
    }

    const items = fs.readdirSync(mcpDir);
    for (const item of items) {
      const itemPath = path.join(mcpDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const configPath = path.join(itemPath, 'config.json');
        if (fs.existsSync(configPath)) {
          try {
            const data = fs.readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(data);
            definitions.push({
              name: parsed.name || item,
              displayName: parsed.displayName,
              description: parsed.description || '',
              mcpConfig: parsed.mcpConfig
            });
          } catch (e) {
            // Ignore corrupted configs
          }
        }
      }
    }
    return definitions;
  }

  export const RECOMMENDED_MCPS: McpDefinition[] = loadMcpDefinitions();

  // Update checkMcpInstalled and installMcpServer to use RECOMMENDED_MCPS loading or config.json directly.
  export function checkMcpInstalled(name: string): boolean {
    const config = getClaudeConfig();
    if (config.mcpServers && config.mcpServers[name]) {
      return true;
    }
    return false;
  }

  export function getClaudeConfig(): ClaudeConfig {
    if (!fs.existsSync(CLAUDE_CONFIG_FILE)) {
      return {};
    }
    try {
      const data = fs.readFileSync(CLAUDE_CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as ClaudeConfig;
    } catch {
      return {};
    }
  }

  export function saveClaudeConfig(config: ClaudeConfig): void {
    if (!fs.existsSync(CLAUDE_CONFIG_DIR)) {
      fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: True });
    }
    fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  export function installMcpServer(name: string, customArgs?: string[], customEnv?: Record<string, string>): void {
    const defs = loadMcpDefinitions();
    const def = defs.find(m => m.name === name);
    if (!def || !def.mcpConfig) {
      throw new Error(`MCP Server "${name}" is not supported or missing config.`);
    }

    const cmdConfig = def.mcpConfig;
    
    // Attempt global install if NPX/npm package is defined in args
    if (cmdConfig.command === 'npx' && cmdConfig.args.length > 1) {
      const pkg = cmdConfig.args[1];
      try {
        console.log(`Installing ${pkg} globally via npm...`);
        execSync(`npm install -g ${pkg}`, { stdio: 'ignore' });
      } catch {
        console.log('Global npm install failed, will fallback to npx execution.');
      }
    }

    const config = getClaudeConfig();
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers[name] = {
      command: cmdConfig.command,
      args: customArgs || cmdConfig.args,
      ...(customEnv && Object.keys(customEnv).length > 0 ? { env: customEnv } : (cmdConfig.env ? { env: cmdConfig.env } : {}))
    };

    saveClaudeConfig(config);
  }
  ```

- [ ] **Step 2: Modify `src/commands/mcp.ts`**
  Modify [src/commands/mcp.ts](file:///D:/Projects/vibe/jagopakaiAI-cli/src/commands/mcp.ts) to fetch dynamically loaded definitions:
  ```typescript
  import * as p from '@clack/prompts';
  import { loadMcpDefinitions, checkMcpInstalled, installMcpServer } from '../utils/mcp.js';

  export async function mcpListCommand() {
    p.intro('JagoPakaiAI Recommended MCP Servers');
    const defs = loadMcpDefinitions();
    const listRows = defs.map((m, idx) => {
      const isInstalled = checkMcpInstalled(m.name);
      const status = isInstalled ? '✅ Installed' : '❌ Not Installed';
      return `${idx + 1}. ${m.displayName || m.name} - ${m.description} [${status}]`;
    });

    p.note(listRows.join('\n'), 'Available MCP Servers');

    const action = await p.confirm({
      message: 'Would you like to install one of these MCP servers in Claude Code config?',
    });

    if (action && !p.isCancel(action)) {
      const choices = defs.map(m => ({ value: m.name, label: `${m.displayName || m.name}` }));
      const selectMcp = await p.select({
        message: 'Select an MCP server to install:',
        options: choices,
      });

      if (!p.isCancel(selectMcp)) {
        await mcpInstallCommand(selectMcp as string);
      }
    }
    p.outro('MCP configuration check complete!');
  }

  export async function mcpInstallCommand(name: string) {
    const defs = loadMcpDefinitions();
    const def = defs.find(m => m.name === name);
    if (!def) {
      p.log.error(`MCP Server "${name}" is not supported.`);
      return;
    }

    const s = p.spinner();
    s.start(`Installing and registering MCP server "${name}"...`);
    try {
      installMcpServer(name);
      s.stop(`Successfully installed and registered MCP "${name}" in Claude Code configuration!`);
    } catch (e: any) {
      s.stop(`Failed to install: ${e.message}`);
    }
  }
  ```

- [ ] **Step 3: Run typescript build and tests**
  Run: `npm run build`
  Expected: Typescript compiles successfully.

- [ ] **Step 4: Commit CLI modifications**
  Run: `git add src/utils/mcp.ts src/commands/mcp.ts; git commit -m "feat: make CLI MCP list dynamic using scraped folder configurations"`
