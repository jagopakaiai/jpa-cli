import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

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
  description: string;
  package: string;
  defaultArgs: string[];
}

export const RECOMMENDED_MCPS: McpDefinition[] = [
  {
    name: 'sqlite',
    description: 'SQLite database inspection and operations tool',
    package: '@modelcontextprotocol/server-sqlite',
    defaultArgs: ['--db', 'sqlite.db']
  },
  {
    name: 'postgres',
    description: 'Postgres database connection and explorer tool',
    package: '@modelcontextprotocol/server-postgres',
    defaultArgs: []
  },
  {
    name: 'filesystem',
    description: 'Provides controlled local filesystem access to AI agents',
    package: '@modelcontextprotocol/server-filesystem',
    defaultArgs: [path.join(os.homedir(), 'Projects')] // fallback default path
  },
  {
    name: 'fetch',
    description: 'Fetches web content and converts HTML to markdown',
    package: '@modelcontextprotocol/server-fetch',
    defaultArgs: []
  },
  {
    name: 'github',
    description: 'Enables repository, pull requests, and issues automation',
    package: '@modelcontextprotocol/server-github',
    defaultArgs: []
  },
  {
    name: 'memory',
    description: 'Graph-based knowledge indexing and semantic storage',
    package: '@modelcontextprotocol/server-memory',
    defaultArgs: []
  }
];

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
    fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function checkMcpInstalled(name: string): boolean {
  const config = getClaudeConfig();
  if (config.mcpServers && config.mcpServers[name]) {
    return true;
  }
  return false;
}

export function installMcpServer(name: string, customArgs?: string[]): void {
  const def = RECOMMENDED_MCPS.find(m => m.name === name);
  if (!def) {
    throw new Error(`MCP Server "${name}" is not supported.`);
  }

  // Pre-install package globally for high speed execution or run directly via npx
  try {
    console.log(`Installing ${def.package} globally via npm...`);
    execSync(`npm install -g ${def.package}`, { stdio: 'ignore' });
  } catch {
    // If global install fails (e.g. permissions), we will rely on npx resolving it on execution
    console.log('Global npm install failed, will fallback to npx execution.');
  }

  const config = getClaudeConfig();
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Configure command definition
  config.mcpServers[name] = {
    command: 'npx',
    args: ['-y', def.package, ...(customArgs || def.defaultArgs)]
  };

  saveClaudeConfig(config);
}
